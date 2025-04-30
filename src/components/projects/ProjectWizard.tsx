
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectDocuments } from './wizard/ProjectDocuments';
import { ProjectMilestones } from './wizard/ProjectMilestones';
import { ProjectWizardSummary } from './wizard/ProjectWizardSummary';
import { supabase } from '@/integrations/supabase/client';
import { WizardProgress } from './wizard/WizardProgress';
import { WizardActions } from './wizard/WizardActions';
import { useProjectWizard } from '@/hooks/useProjectWizard';

interface ProjectWizardProps {
  initialProjectId?: string | null;
}

export function ProjectWizard({ initialProjectId }: ProjectWizardProps) {
  const navigate = useNavigate();
  const {
    user,
    currentStep,
    formData,
    isLoading,
    initialLoading,
    handleNextStep,
    handlePreviousStep,
    updateFormData,
    setFormData,
    setIsLoading
  } = useProjectWizard(initialProjectId);

  const handleBasicInfoSubmit = (data: Partial<typeof formData>) => {
    updateFormData(data);
    handleNextStep();
  };

  const handleDocumentsSubmit = (documents: typeof formData.documents) => {
    setFormData(prev => ({ ...prev, documents }));
    handleNextStep();
  };

  const handleMilestonesSubmit = (milestones: typeof formData.milestones) => {
    setFormData(prev => ({ ...prev, milestones }));
    handleNextStep();
  };

  const handleCreateProject = async () => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    setIsLoading(true);

    try {
      // Insert project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          client: formData.client,
          location: formData.location,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          description: formData.description,
          value: formData.value,
          start_date: formData.startDate.toISOString().split('T')[0],
          end_date: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
          project_type_id: formData.projectTypeId,
          status: 'draft'
        })
        .select('id')
        .single();

      if (projectError) throw projectError;

      // Upload documents if any
      if (formData.documents.length > 0 && project) {
        // Use the original document objects to preserve custom properties
        for (const document of formData.documents) {
          const file = document.file;
          
          // Create a unique file path to avoid conflicts
          const filePath = `${project.id}/${Date.now()}-${file.name}`;
          
          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) throw uploadError;
          
          // Insert into project_files table
          const { error: fileError } = await supabase
            .from('project_files')
            .insert({
              project_id: project.id,
              name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              shared_with_client: document.sharedWithClient,
              user_id: user.id,
              description: document.description || null
            });
          
          if (fileError) throw fileError;
        }
      }

      // Insert milestones if any
      if (formData.milestones.length > 0 && project) {
        const milestonesToInsert = formData.milestones.map(milestone => ({
          project_id: project.id,
          name: milestone.name,
          description: milestone.description,
          due_date: milestone.dueDate ? milestone.dueDate.toISOString().split('T')[0] : null,
          amount: milestone.amount,
          percentage: milestone.percentage,
          is_completed: false,
          due_type: milestone.dueType
        }));

        const { error: milestonesError } = await supabase
          .from('milestones')
          .insert(milestonesToInsert);

        if (milestonesError) throw milestonesError;
      }

      toast.success('Project created successfully');
      
      // Navigate to the project page
      if (project && project.id) {
        navigate(`/projects/${project.id}`);
      } else {
        navigate('/projects');
      }

    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p>Loading project data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={currentStep} />

      <Card className="p-6">
        {currentStep === 'basic-info' && (
          <ProjectBasicInfo 
            initialData={formData} 
            onSubmit={handleBasicInfoSubmit} 
          />
        )}
        
        {currentStep === 'documents' && (
          <ProjectDocuments
            initialDocuments={formData.documents}
            onBack={handlePreviousStep}
            onSubmit={handleDocumentsSubmit}
          />
        )}
        
        {currentStep === 'milestones' && (
          <ProjectMilestones
            initialMilestones={formData.milestones}
            projectTypeId={formData.projectTypeId}
            projectValue={formData.value}
            onBack={handlePreviousStep}
            onSubmit={handleMilestonesSubmit}
          />
        )}
        
        {currentStep === 'summary' && (
          <ProjectWizardSummary
            projectData={{
              ...formData,
              documents: formData.documents.map(doc => ({
                ...doc.file,
                sharedWithClient: doc.sharedWithClient,
                description: doc.description
              }))
            }}
            isLoading={isLoading}
            onBack={handlePreviousStep}
            onSubmit={handleCreateProject}
          />
        )}
      </Card>
    </div>
  );
}
