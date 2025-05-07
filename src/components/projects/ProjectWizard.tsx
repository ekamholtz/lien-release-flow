
import React, { useState, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectWizard } from '@/hooks/useProjectWizard';
import { useProjectSubmission } from '@/hooks/useProjectSubmission';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectMilestones } from './wizard/ProjectMilestones';
import { ProjectDocuments } from './wizard/ProjectDocuments';
import { ProjectWizardSummary } from './wizard/ProjectWizardSummary';
import { WizardProgress } from './wizard/WizardProgress';

enum WizardStep {
  BasicInfo = 0,
  Documents = 1,
  Milestones = 2,
  Summary = 3,
}

interface ProjectWizardProps {
  onClose: () => void;
  initialProjectId?: string;
}

export function ProjectWizard({ onClose, initialProjectId }: ProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BasicInfo);
  const { user } = useAuth();
  const { formData, updateFormData } = useProjectWizard();
  const { submitProject, isSubmitting } = useProjectSubmission();
  
  const totalSteps = Object.keys(WizardStep).length / 2;
  
  const handleNext = () => {
    setCurrentStep((prev) => {
      const nextStep = prev + 1;
      return nextStep < totalSteps ? nextStep : prev;
    });
  };
  
  const handleBack = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    const success = await submitProject(formData, user.id, initialProjectId);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="space-y-6 w-full">
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={totalSteps}
      />
      
      <div className="pt-4">
        {currentStep === WizardStep.BasicInfo && (
          <ProjectBasicInfo 
            formData={formData}
            onUpdate={updateFormData}
            onNext={handleNext}
          />
        )}
        
        {currentStep === WizardStep.Documents && (
          <ProjectDocuments
            documents={formData.documents}
            onUpdate={(documents) => updateFormData({ documents })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        
        {currentStep === WizardStep.Milestones && (
          <ProjectMilestones
            initialMilestones={formData.milestones}
            projectTypeId={formData.projectTypeId}
            projectValue={formData.value}
            onSubmit={(milestones) => {
              updateFormData({ milestones });
              handleNext();
            }}
            onBack={handleBack}
          />
        )}
        
        {currentStep === WizardStep.Summary && (
          <ProjectWizardSummary
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
