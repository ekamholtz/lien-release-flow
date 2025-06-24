
import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProjectBasicInfoSummary } from './ProjectBasicInfoSummary';
import { ProjectContactInfoSummary } from './ProjectContactInfoSummary';
import { ProjectDescriptionSummary } from './ProjectDescriptionSummary';
import { ProjectDocumentsSummary } from './ProjectDocumentsSummary';
import { ProjectMilestonesSummary } from './ProjectMilestonesSummary';
import { ProjectContractSummary } from './ProjectContractSummary';
import { useProjectTypeLookup } from './useProjectTypeLookup';
import { ContractData } from '../ProjectContract';

// Extend the File type to include our custom properties
interface ExtendedFile extends File {
  sharedWithClient?: boolean;
  description?: string | null;
}

interface ProjectWizardSummaryContentProps {
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
    contractData?: ContractData;
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
}

export function ProjectWizardSummaryContent({ projectData }: ProjectWizardSummaryContentProps) {
  const { projectType } = useProjectTypeLookup(projectData.projectTypeId);

  return (
    <Card className="p-6 space-y-6">
      <ProjectBasicInfoSummary
        name={projectData.name}
        client={projectData.client}
        location={projectData.location}
        value={projectData.value}
        startDate={projectData.startDate}
        endDate={projectData.endDate}
        projectType={projectType}
      />
      
      {(projectData.contactName || projectData.contactEmail || projectData.contactPhone) && (
        <>
          <Separator />
          <ProjectContactInfoSummary
            contactName={projectData.contactName}
            contactEmail={projectData.contactEmail}
            contactPhone={projectData.contactPhone}
          />
        </>
      )}
      
      {projectData.description && (
        <>
          <Separator />
          <ProjectDescriptionSummary description={projectData.description} />
        </>
      )}
      
      {projectData.contractData && projectData.contractData.type !== 'skip' && (
        <>
          <Separator />
          <ProjectContractSummary contractData={projectData.contractData} />
        </>
      )}
      
      {projectData.milestones.length > 0 && (
        <>
          <Separator />
          <ProjectMilestonesSummary milestones={projectData.milestones} />
        </>
      )}
      
      {projectData.documents.length > 0 && (
        <>
          <Separator />
          <ProjectDocumentsSummary documents={projectData.documents} />
        </>
      )}
    </Card>
  );
}
