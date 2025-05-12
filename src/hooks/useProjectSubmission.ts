import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProjectFormData } from '@/hooks/useProjectWizard';
import { useCompany } from '@/contexts/CompanyContext';

export function useProjectSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  const submitProject = async (formData: ProjectFormData, userId?: string, initialProjectId?: string) => {
    if (!userId) {
      toast.error('You must be logged in to create a project');
      return false;
    }

    if (!formData.companyId && !currentCompany?.id) {
      toast.error('No company selected. Please select a company first.');
      return false;
    }

    const companyId = formData.companyId || currentCompany?.id;
    if (!companyId) {
      toast.error('No company ID available. Please select a company first.');
      return false;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting project submission with data:', { 
        ...formData, 
        companyId, 
        initialProjectId: initialProjectId || 'None' 
      });
      
      let projectId: string;
      
      // First, get the client name for the legacy client field
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("name")
        .eq("id", formData.clientId)
        .single();
        
      if (clientError) {
        throw new Error(`Failed to fetch client details: ${clientError.message}`);
      }

      const clientName = clientData.name;
      
      // Check if we're updating an existing project or creating a new one
      if (initialProjectId) {
        console.log('Updating existing project:', initialProjectId);
        
        // Update project with new data
        const { data: updatedProject, error: updateError } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            client_id: formData.clientId,
            client: clientName, // Use client name from fetched data
            location: formData.location,
            contact_name: formData.contactName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            description: formData.description,
            value: formData.value,
            start_date: formData.startDate.toISOString().split('T')[0],
            end_date: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
            project_type_id: formData.projectTypeId,
            project_manager_id: formData.projectManagerId || userId,
            company_id: companyId,
            status: 'active', // Update status to active
          })
          .eq('id', initialProjectId)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }
        
        projectId = updatedProject.id;
        console.log('Project updated successfully:', projectId);
      } else {
        // Insert new project
        console.log('Creating new project');
        
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            client_id: formData.clientId,
            client: clientName, // Use client name from fetched data
            location: formData.location,
            contact_name: formData.contactName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            description: formData.description,
            value: formData.value,
            start_date: formData.startDate.toISOString().split('T')[0],
            end_date: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
            project_type_id: formData.projectTypeId,
            project_manager_id: formData.projectManagerId || userId,
            company_id: companyId,
            status: 'active' // Set status to active for new projects
          })
          .select('id')
          .single();

        if (projectError) {
          console.error('Error creating project:', projectError);
          throw projectError;
        }
        
        projectId = project.id;
        console.log('Project created successfully:', projectId);
      }
      
      // If we're updating an existing project, clean up old milestones if needed
      if (initialProjectId) {
        // First, get existing milestones
        const { data: existingMilestones, error: fetchError } = await supabase
          .from('milestones')
          .select('id')
          .eq('project_id', initialProjectId);
          
        if (fetchError) {
          console.error('Error fetching existing milestones:', fetchError);
        } else if (existingMilestones && existingMilestones.length > 0) {
          // Get list of milestone IDs that are safe to delete (not referenced by invoices)
          const { data: referencedMilestones, error: refError } = await supabase
            .from('invoices')
            .select('source_milestone_id')
            .in('source_milestone_id', existingMilestones.map(m => m.id));
            
          if (refError) {
            console.error('Error checking referenced milestones:', refError);
          } else {
            // Create a set of milestone IDs that are referenced by invoices
            const referencedIds = new Set(referencedMilestones?.map(r => r.source_milestone_id) || []);
            
            // Filter out milestones that are referenced by invoices
            const deletableMilestoneIds = existingMilestones
              .filter(m => !referencedIds.has(m.id))
              .map(m => m.id);
            
            if (deletableMilestoneIds.length > 0) {
              // Delete only milestones that are not referenced by invoices
              const { error: deleteError } = await supabase
                .from('milestones')
                .delete()
                .in('id', deletableMilestoneIds);
                
              if (deleteError) {
                console.error('Error cleaning up old milestones:', deleteError);
                // Continue execution - non-critical error
              }
            }
          }
        }
      }

      // Upload documents if any
      await uploadProjectDocuments(formData.documents, projectId, userId);

      // Insert milestones if any
      await createProjectMilestones(formData.milestones, projectId, companyId);

      toast.success(initialProjectId ? 'Project updated successfully' : 'Project created successfully');
      
      // Navigate to the project page
      if (projectId) {
        console.log('Navigating to project page:', projectId);
        navigate(`/projects/${projectId}`);
      } else {
        console.log('No project ID found, navigating to projects list');
        navigate('/projects');
      }
      
      return true;

    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProjectDocuments = async (
    documents: ProjectFormData['documents'],
    projectId: string,
    userId: string
  ) => {
    if (documents.length === 0) return;

    console.log('Uploading documents:', documents.length);
    
    for (const document of documents) {
      const file = document.file;
      
      // Create a unique file path to avoid conflicts
      const filePath = `${projectId}/${Date.now()}-${file.name}`;
      
      console.log('Uploading file:', file.name, 'to path:', filePath);
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      console.log('File uploaded successfully, inserting file record');
      
      // Insert into project_files table
      const { error: fileError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          shared_with_client: document.sharedWithClient,
          user_id: userId,
          description: document.description || null
        });
      
      if (fileError) {
        console.error('Error inserting file record:', fileError);
        throw fileError;
      }
      
      console.log('File record inserted successfully');
    }
  };

  const createProjectMilestones = async (
    milestones: ProjectFormData['milestones'],
    projectId: string,
    companyId: string
  ) => {
    if (milestones.length === 0) return;
    
    console.log('Inserting milestones:', milestones.length);
    const milestonesToInsert = milestones.map(milestone => ({
      project_id: projectId,
      name: milestone.name,
      description: milestone.description,
      due_date: milestone.dueDate ? milestone.dueDate.toISOString().split('T')[0] : null,
      amount: milestone.amount,
      percentage: milestone.percentage,
      is_completed: false,
      due_type: milestone.dueType,
      company_id: companyId // Add company ID to milestones
    }));

    const { error: milestonesError } = await supabase
      .from('milestones')
      .insert(milestonesToInsert);

    if (milestonesError) {
      console.error('Error inserting milestones:', milestonesError);
      throw milestonesError;
    }
    
    console.log('Milestones inserted successfully');
  };

  return {
    submitProject,
    isSubmitting
  };
}
