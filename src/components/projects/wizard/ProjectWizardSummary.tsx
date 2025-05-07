
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { WizardActions } from './WizardActions';
import { ProjectWizardSummaryContent } from './summary/ProjectWizardSummaryContent';
import { supabase } from '@/integrations/supabase/client';

// Extend the File type to include our custom properties
interface ExtendedFile extends File {
  sharedWithClient?: boolean;
  description?: string | null;
}

interface ProjectWizardSummaryProps {
  projectData: {
    name: string;
    clientId: string;
    client?: string; // Make client optional
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
  const [clientName, setClientName] = useState<string>(projectData.client || "");
  const isValid = projectData.name && 
    projectData.clientId && 
    projectData.value > 0 && 
    projectData.startDate;
    
  // Fetch client name if not provided
  useEffect(() => {
    const fetchClientName = async () => {
      if (!projectData.client && projectData.clientId) {
        try {
          const { data } = await supabase
            .from('clients')
            .select('name')
            .eq('id', projectData.clientId)
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
  }, [projectData.clientId, projectData.client]);

  const summaryData = {
    ...projectData,
    client: clientName
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Summary</h3>
        <p className="text-sm text-muted-foreground">
          Review your project details before creating it.
        </p>
      </div>
      
      <ProjectWizardSummaryContent projectData={summaryData} />
      
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
