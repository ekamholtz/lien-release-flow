import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectDocuments, ProjectDocument } from './wizard/ProjectDocuments';
import { ProjectMilestones, Milestone } from './wizard/ProjectMilestones';
import { ProjectWizardSummary } from './wizard/ProjectWizardSummary';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ProjectType } from '@/types/project';

type WizardStep = 'basic-info' | 'documents' | 'milestones' | 'summary';

interface ProjectFormData {
  name: string;
  client: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  value: number;
  startDate: Date;
  endDate?: Date | null;
  projectTypeId?: string;
  documents: ProjectDocument[];
  milestones: Milestone[];
}

interface ProjectWizardProps {
  initialProjectId?: string | null;
}

export function ProjectWizard({ initialProjectId }: ProjectWizardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    client: '',
    value: 0,
    startDate: new Date(),
    documents: [],
    milestones: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [initialLoading, setInitialLoading] = useState(!!initialProjectId);

  // Load project data if initialProjectId is provided
  useEffect(() => {
    async function loadProjectData() {
      if (!initialProjectId) return;
      
      setInitialLoading(true);
      try {
        // Fetch project details
        const { data: project, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', initialProjectId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (project) {
          // Convert the data format to match our form data
          setFormData({
            name: project.name || '',
            client: project.client || '',
            location: project.location || '',
            contactName: project.contact_name || '',
            contactEmail: project.contact_email || '',
            contactPhone: project.contact_phone || '',
            description: project.description || '',
            value: project.value || 0,
            startDate: project.start_date ? new Date(project.start_date) : new Date(),
            endDate: project.end_date ? new Date(project.end_date) : null,
            projectTypeId: project.project_type_id || undefined,
            documents: [], // These will be loaded separately
            milestones: [] // These will be loaded separately
          });
          
          // Load project documents
          const { data: documents } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', initialProjectId);
            
          // Load project milestones
          const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .eq('project_id', initialProjectId);
            
          // We can't load the actual file objects here since they're not stored in the database
          // but we can update the UI with the metadata
          
          console.log('Project loaded successfully:', project.name);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project data');
      } finally {
        setInitialLoading(false);
      }
    }
    
    loadProjectData();
  }, [initialProjectId]);

  const handleNextStep = () => {
    if (currentStep === 'basic-info') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('milestones');
    } else if (currentStep === 'milestones') {
      setCurrentStep('summary');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'documents') {
      setCurrentStep('basic-info');
    } else if (currentStep === 'milestones') {
      setCurrentStep('documents');
    } else if (currentStep === 'summary') {
      setCurrentStep('milestones');
    }
  };

  const handleBasicInfoSubmit = (data: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    handleNextStep();
  };

  const handleDocumentsSubmit = (documents: ProjectDocument[]) => {
    setFormData(prev => ({ ...prev, documents }));
    handleNextStep();
  };

  const handleMilestonesSubmit = (milestones: Milestone[]) => {
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
              shared_with_client: document.sharedWithClient, // Use document property instead of file
              user_id: user.id,
              description: document.description || null // Use document property instead of file
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
      <div className="flex justify-center mb-6">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'basic-info' || currentStep === 'documents' || currentStep === 'milestones' || currentStep === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className="w-12 h-1 bg-gray-200">
            <div className={`h-1 ${currentStep === 'documents' || currentStep === 'milestones' || currentStep === 'summary' ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'documents' || currentStep === 'milestones' || currentStep === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          <div className="w-12 h-1 bg-gray-200">
            <div className={`h-1 ${currentStep === 'milestones' || currentStep === 'summary' ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'milestones' || currentStep === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            3
          </div>
          <div className="w-12 h-1 bg-gray-200">
            <div className={`h-1 ${currentStep === 'summary' ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            4
          </div>
        </div>
      </div>

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
              })) // Transform to match expected format in Summary
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
