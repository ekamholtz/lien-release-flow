
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectDocuments } from './wizard/ProjectDocuments';
import { ProjectMilestones } from './wizard/ProjectMilestones';
import { ProjectWizardSummary } from './wizard/ProjectWizardSummary';
import { WizardProgress } from './wizard/WizardProgress';
import { useProjectWizard } from '@/hooks/useProjectWizard';
import { useProjectSubmission } from '@/hooks/useProjectSubmission';
import { supabase } from '@/integrations/supabase/client';

interface ProjectWizardContainerProps {
  initialProjectId?: string | null;
}

export function ProjectWizardContainer({ initialProjectId }: ProjectWizardContainerProps) {
  const {
    user,
    currentStep,
    formData,
    initialLoading,
    handleNextStep,
    handlePreviousStep,
    updateFormData,
    setFormData
  } = useProjectWizard(initialProjectId);

  const { submitProject, isSubmitting } = useProjectSubmission();
  const [clientName, setClientName] = useState("");

  // Fetch client name when clientId changes
  useEffect(() => {
    const fetchClientName = async () => {
      if (formData.clientId) {
        try {
          const { data } = await supabase
            .from('clients')
            .select('name')
            .eq('id', formData.clientId)
            .single();
            
          if (data) {
            setClientName(data.name);
          }
        } catch (error) {
          console.error('Error fetching client name:', error);
        }
      }
    };
    
    fetchClientName();
  }, [formData.clientId]);

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
    await submitProject(formData, user?.id);
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
              client: clientName,
              documents: formData.documents.map(doc => ({
                ...doc.file,
                sharedWithClient: doc.sharedWithClient,
                description: doc.description
              }))
            }}
            isLoading={isSubmitting}
            onBack={handlePreviousStep}
            onSubmit={handleCreateProject}
          />
        )}
      </Card>
    </div>
  );
}
