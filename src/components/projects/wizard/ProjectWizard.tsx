
import React, { useState, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectWizard } from '@/hooks/useProjectWizard';
import { useProjectSubmission } from '@/hooks/useProjectSubmission';
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectContract, ContractData } from './ProjectContract';
import { ProjectMilestones } from './ProjectMilestones';
import { ProjectDocuments } from './ProjectDocuments';
import { ProjectWizardSummary } from './ProjectWizardSummary';
import { WizardProgress, WizardStep } from './WizardProgress';
import { supabase } from '@/integrations/supabase/client';

interface ProjectWizardProps {
  onClose: () => void;
  initialProjectId?: string;
  basicInfoOnly?: boolean;
}

export function ProjectWizard({ onClose, initialProjectId, basicInfoOnly = false }: ProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const { user } = useAuth();
  // Pass initialProjectId to the useProjectWizard hook to load project data
  const { formData, updateFormData, initialLoading } = useProjectWizard(initialProjectId);
  const { submitProject, isSubmitting } = useProjectSubmission();
  const [contractData, setContractData] = useState<ContractData>({ type: 'skip' });
  
  const handleNext = () => {
    if (currentStep === 'basic-info') {
      if (basicInfoOnly) {
        setCurrentStep('summary');
      } else {
        setCurrentStep('contract');
      }
    } else if (currentStep === 'contract') {
      setCurrentStep('milestones');
    } else if (currentStep === 'milestones') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('summary');
    }
  };
  
  const handleBack = () => {
    if (currentStep === 'contract') {
      setCurrentStep('basic-info');
    } else if (currentStep === 'milestones') {
      setCurrentStep('contract');
    } else if (currentStep === 'documents') {
      setCurrentStep('milestones');
    } else if (currentStep === 'summary') {
      if (basicInfoOnly) {
        setCurrentStep('basic-info');
      } else {
        setCurrentStep('documents');
      }
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
      contractData,
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
        basicInfoOnly={basicInfoOnly}
      />
      
      <div className="pt-4">
        {currentStep === 'basic-info' && (
          // Debug: Log what data is being passed to ProjectBasicInfo
          console.log("ProjectWizard passing to ProjectBasicInfo:", formData),
          <ProjectBasicInfo 
            initialData={formData}
            onSubmit={(data) => {
              updateFormData(data);
              handleNext();
            }}
            onCancel={onClose}
          />
        )}
        
        {currentStep === 'contract' && (
          <ProjectContract
            initialContract={contractData}
            projectValue={formData.value}
            onBack={handleBack}
            onSubmit={(contract) => {
              setContractData(contract);
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
        
        {currentStep === 'summary' && (
          <ProjectWizardSummary
            projectData={{
              ...formData,
              client: "", // This is now handled at render time
              contractData,
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
