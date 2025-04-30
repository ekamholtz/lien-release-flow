
import React from 'react';
import { Button } from '@/components/ui/button';
import { WizardActions } from './WizardActions';
import { ProjectWizardSummaryContent } from './summary/ProjectWizardSummaryContent';

// Extend the File type to include our custom properties
interface ExtendedFile extends File {
  sharedWithClient?: boolean;
  description?: string | null;
}

interface ProjectWizardSummaryProps {
  projectData: {
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
    documents: ExtendedFile[];
    milestones: {
      name: string;
      description?: string;
      amount: number;
      dueDate?: Date | null;
      percentage?: number;
      dueType?: string;
    }[];
  };
  isLoading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function ProjectWizardSummary({ 
  projectData, 
  isLoading,
  onBack, 
  onSubmit 
}: ProjectWizardSummaryProps) {
  const isValid = projectData.name && 
    projectData.client && 
    projectData.value > 0 && 
    projectData.startDate;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Summary</h3>
        <p className="text-sm text-muted-foreground">
          Review your project details before creating it.
        </p>
      </div>
      
      <ProjectWizardSummaryContent projectData={projectData} />
      
      <WizardActions
        showBack={true}
        onBack={onBack}
        onNext={onSubmit}
        nextLabel="Create Project"
        nextDisabled={!isValid}
        isLoading={isLoading}
      />
    </div>
  );
}
