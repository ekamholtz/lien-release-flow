
import React from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Milestone } from '../ProjectMilestones';
import { MilestoneTemplate } from '@/types/project';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MilestoneTemplateSelectorProps {
  templates: MilestoneTemplate[];
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  milestones: Milestone[];
  totalPercentage: number;
  projectValue: number;
  onApplyTemplate: () => void;
  onDuplicateTemplate: () => void;
}

export function MilestoneTemplateSelector({
  templates,
  selectedTemplate,
  setSelectedTemplate,
  milestones,
  totalPercentage,
  projectValue,
  onApplyTemplate,
  onDuplicateTemplate
}: MilestoneTemplateSelectorProps) {
  if (templates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
        <h3 className="text-sm font-medium">No templates available</h3>
        <p className="text-xs text-gray-500 mt-1">Create custom payment schedule instead</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-grow">
          <Label htmlFor="template-select">Select Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger id="template-select">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={onApplyTemplate} 
            disabled={!selectedTemplate}
            className="mb-0.5"
          >
            Apply Template
          </Button>
          {milestones.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onDuplicateTemplate}
              className="mb-0.5"
            >
              Duplicate & Edit
            </Button>
          )}
        </div>
      </div>
      
      {milestones.length > 0 && (
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Preview</h4>
            <div className="text-sm">
              Total: {totalPercentage.toFixed(2)}%
            </div>
          </div>
          
          <Progress value={totalPercentage} className="h-2" />
          
          <div className="border rounded-md divide-y">
            {milestones.map((milestone, index) => (
              <div key={index} className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{milestone.name}</p>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  <p className="text-sm font-medium">${milestone.amount.toFixed(2)}</p>
                  <p className="text-sm">{milestone.percentage?.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
