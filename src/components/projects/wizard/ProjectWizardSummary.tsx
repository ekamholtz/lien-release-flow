
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileIcon, Calendar, MapPin, User, Phone, Mail, DollarSign, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectType } from '@/types/project';

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
    documents: File[];
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
  const { data: projectType } = useQuery({
    queryKey: ['project-type', projectData.projectTypeId],
    queryFn: async () => {
      if (!projectData.projectTypeId) return null;
      
      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .eq('id', projectData.projectTypeId)
        .single();
        
      if (error) throw error;
      
      return data as ProjectType;
    },
    enabled: !!projectData.projectTypeId
  });

  const totalMilestoneAmount = projectData.milestones.reduce(
    (sum, milestone) => sum + milestone.amount, 
    0
  );
  
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
      
      <Card className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Project Name</p>
              <p className="text-sm text-gray-600">{projectData.name}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Client</p>
              <p className="text-sm text-gray-600">{projectData.client}</p>
            </div>
            
            {projectData.location && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1" /> Location
                </p>
                <p className="text-sm text-gray-600">{projectData.location}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1" /> Contract Value
              </p>
              <p className="text-sm text-gray-600">${projectData.value.toLocaleString()}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> Start Date
              </p>
              <p className="text-sm text-gray-600">{format(projectData.startDate, 'PPP')}</p>
            </div>
            
            {projectData.endDate && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> End Date
                </p>
                <p className="text-sm text-gray-600">{format(projectData.endDate, 'PPP')}</p>
              </div>
            )}
            
            {projectType && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Project Type</p>
                <p className="text-sm text-gray-600">{projectType.name}</p>
              </div>
            )}
          </div>
        </div>
        
        {(projectData.contactName || projectData.contactEmail || projectData.contactPhone) && (
          <>
            <Separator />
            
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectData.contactName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-1" /> Contact Name
                    </p>
                    <p className="text-sm text-gray-600">{projectData.contactName}</p>
                  </div>
                )}
                
                {projectData.contactEmail && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-1" /> Email
                    </p>
                    <p className="text-sm text-gray-600">{projectData.contactEmail}</p>
                  </div>
                )}
                
                {projectData.contactPhone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1" /> Phone
                    </p>
                    <p className="text-sm text-gray-600">{projectData.contactPhone}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {projectData.description && (
          <>
            <Separator />
            
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1" /> Description
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{projectData.description}</p>
            </div>
          </>
        )}
        
        {projectData.documents.length > 0 && (
          <>
            <Separator />
            
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Documents ({projectData.documents.length})</h4>
              <ul className="space-y-2">
                {projectData.documents.map((file, index) => (
                  <li key={index} className="flex items-center">
                    <FileIcon className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        {projectData.milestones.length > 0 && (
          <>
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-500">Milestones ({projectData.milestones.length})</h4>
                <span className="text-sm font-medium">
                  Total: ${totalMilestoneAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-3 mt-3">
                {projectData.milestones.map((milestone, index) => (
                  <div key={index} className="flex justify-between pb-2 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium">{milestone.name}</p>
                      {milestone.dueDate && (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(milestone.dueDate, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${milestone.amount.toLocaleString()}</p>
                      {milestone.percentage !== undefined && milestone.percentage > 0 && (
                        <p className="text-xs text-gray-500">{milestone.percentage}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          type="button" 
          onClick={onSubmit} 
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Creating Project...' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
}
