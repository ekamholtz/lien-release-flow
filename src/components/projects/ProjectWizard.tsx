
import React, { useState, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectWizard } from '@/hooks/useProjectWizard';
import { useProjectSubmission } from '@/hooks/useProjectSubmission';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectMilestones } from './wizard/ProjectMilestones';
import { ProjectDocuments } from './wizard/ProjectDocuments';
import { ProjectWizardSummary } from './wizard/ProjectWizardSummary';
import { WizardProgress, WizardStep } from './wizard/WizardProgress';
import { supabase } from '@/integrations/supabase/client';

interface ProjectWizardProps {
  onClose: () => void;
  initialProjectId?: string;
}

export function ProjectWizard({ onClose, initialProjectId }: ProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const { user } = useAuth();
  const { formData, updateFormData } = useProjectWizard();
  const { submitProject, isSubmitting } = useProjectSubmission();
  
  const handleNext = () => {
    if (currentStep === 'basic-info') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('milestones');
    } else if (currentStep === 'milestones') {
      setCurrentStep('summary');
    }
  };
  
  const handleBack = () => {
    if (currentStep === 'documents') {
      setCurrentStep('basic-info');
    } else if (currentStep === 'milestones') {
      setCurrentStep('documents');
    } else if (currentStep === 'summary') {
      setCurrentStep('milestones');
    }
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    const success = await submitProject(formData, user.id, initialProjectId);
    if (success) {
      onClose();
    }
  };

  // Function to fetch client name from client ID
  const getProjectDataForSummary = async () => {
    let clientName = "";
    if (formData.clientId) {
      try {
        const { data } = await supabase
          .from('clients')
          .select('name')
          .eq('id', formData.clientId)
          .single();
        
        if (data) {
          clientName = data.name;
        }
      } catch (error) {
        console.error('Error fetching client name:', error);
      }
    }
    
    return {
      ...formData,
      client: clientName,
      documents: formData.documents.map(doc => ({
        ...doc.file,
        sharedWithClient: doc.sharedWithClient,
        description: doc.description
      }))
    };
  };

  return (
    <div className="space-y-6 w-full">
      <WizardProgress 
        currentStep={currentStep}
      />
      
      <div className="pt-4">
        {currentStep === 'basic-info' && (
          <ProjectBasicInfo 
            initialData={formData}
            onSubmit={(data) => {
              updateFormData(data);
              handleNext();
            }}
          />
        )}
        
        {currentStep === 'documents' && (
          <ProjectDocuments
            initialDocuments={formData.documents}
            onBack={handleBack}
            onSubmit={(documents) => {
              updateFormData({ documents });
              handleNext();
            }}
          />
        )}
        
        {currentStep === 'milestones' && (
          <ProjectMilestones
            initialMilestones={formData.milestones}
            projectTypeId={formData.projectTypeId}
            projectValue={formData.value}
            onBack={handleBack}
            onSubmit={(milestones) => {
              updateFormData({ milestones });
              handleNext();
            }}
          />
        )}
        
        {currentStep === 'summary' && (
          <ProjectWizardSummary
            projectData={{
              ...formData,
              client: "", // This is now handled at render time
              documents: formData.documents.map(doc => ({
                ...doc.file,
                sharedWithClient: doc.sharedWithClient,
                description: doc.description
              }))
            }}
            isLoading={isSubmitting}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
