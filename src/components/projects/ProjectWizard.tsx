
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectDocuments } from './wizard/ProjectDocuments';
import { ProjectMilestones } from './wizard/ProjectMilestones';
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
  documents: File[];
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  description?: string;
  amount: number;
  dueDate?: Date | null; 
  percentage?: number;
}

export interface ProjectDocument {
  file: File;
  description?: string;
  sharedWithClient: boolean;
}

export function ProjectWizard() {
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

  const handleDocumentsSubmit = (documents: File[]) => {
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
        for (const document of formData.documents) {
          // Create a unique file path to avoid conflicts
          const filePath = `${user.id}/${Date.now()}-${document.name}`;
          
          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(filePath, document, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) throw uploadError;
          
          // Insert into project_files table
          const { error: fileError } = await supabase
            .from('project_files')
            .insert({
              project_id: project.id,
              name: document.name,
              file_path: filePath,
              file_size: document.size,
              file_type: document.type,
              shared_with_client: false,
              user_id: user.id
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
          is_completed: false
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
            onBack={handlePreviousStep}
            onSubmit={handleMilestonesSubmit}
          />
        )}
        
        {currentStep === 'summary' && (
          <ProjectWizardSummary
            projectData={formData}
            isLoading={isLoading}
            onBack={handlePreviousStep}
            onSubmit={handleCreateProject}
          />
        )}
      </Card>
    </div>
  );
}
