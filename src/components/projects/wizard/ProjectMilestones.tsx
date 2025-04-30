
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { MilestoneScheduleSelector } from './milestone/MilestoneScheduleSelector';
import { MilestoneTemplateSelector } from './milestone/MilestoneTemplateSelector';
import { MilestoneForm } from './milestone/MilestoneForm';
import { useMilestoneTemplates } from './milestone/useMilestoneTemplates';
import { WizardActions } from './WizardActions';

interface ProjectMilestonesProps {
  initialMilestones: Milestone[];
  projectTypeId?: string;
  projectValue: number;
  onBack: () => void;
  onSubmit: (milestones: Milestone[]) => void;
}

export interface Milestone {
  name: string;
  description?: string;
  amount: number;
  dueDate?: Date | null; 
  percentage?: number;
  dueType: 'time' | 'event';
}

export function ProjectMilestones({ 
  initialMilestones, 
  projectTypeId, 
  projectValue,
  onBack, 
  onSubmit 
}: ProjectMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones || []);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'template' | 'custom'>(initialMilestones.length > 0 ? 'custom' : 'template');
  
  // Use the custom hook for template management
  const { templates, isLoading, applyTemplate } = useMilestoneTemplates(projectTypeId);
  
  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return milestones.reduce((total, milestone) => total + (milestone.percentage || 0), 0);
  }, [milestones]);

  // Calculate if percentages are valid
  const isPercentageValid = useMemo(() => {
    return Math.abs(totalPercentage - 100) < 0.01; // Allow small floating point error
  }, [totalPercentage]);
  
  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        name: '',
        description: '',
        amount: 0,
        dueDate: null,
        percentage: 0,
        dueType: 'time',
      },
    ]);
  };
  
  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };
  
  const handleMilestoneChange = (index: number, field: keyof Milestone, value: any) => {
    const updatedMilestones = [...milestones];
    
    // If changing percentage, update the amount
    if (field === 'percentage' && projectValue > 0) {
      const percentage = parseFloat(value) || 0;
      const amount = (percentage / 100) * projectValue;
      
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        percentage,
        amount,
      };
    }
    // If changing amount, update the percentage
    else if (field === 'amount' && projectValue > 0) {
      const amount = parseFloat(value) || 0;
      const percentage = projectValue > 0 ? (amount / projectValue) * 100 : 0;
      
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        amount,
        percentage,
      };
    }
    else {
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        [field]: value,
      };
    }
    
    setMilestones(updatedMilestones);
  };
  
  const handleApplyTemplate = () => {
    applyTemplate(selectedTemplate, projectValue, setMilestones);
  };
  
  const handleScheduleTypeChange = (value: 'template' | 'custom') => {
    setScheduleType(value);
  };
  
  const handleDuplicateTemplate = () => {
    if (selectedTemplate && milestones.length > 0) {
      // Create a custom copy of the current milestones
      setScheduleType('custom');
      toast.success('Template duplicated for custom editing');
    }
  };
  
  const handleContinue = () => {
    // Validate milestones
    const invalidMilestones = milestones.filter(m => !m.name || m.amount <= 0);
    
    if (invalidMilestones.length > 0) {
      toast.error('All milestones must have a name and amount');
      return;
    }
    
    // Check total percentage if using percentages
    if (!isPercentageValid) {
      toast.error('Total percentage must equal 100%');
      return;
    }
    
    onSubmit(milestones);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Define payment milestones for this project using a template or custom schedule.
        </p>
      </div>
      
      <MilestoneScheduleSelector 
        scheduleType={scheduleType} 
        onScheduleTypeChange={handleScheduleTypeChange} 
      />
      
      {scheduleType === 'template' && (
        <MilestoneTemplateSelector
          templates={templates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          milestones={milestones}
          totalPercentage={totalPercentage}
          projectValue={projectValue}
          onApplyTemplate={handleApplyTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
        />
      )}
      
      {scheduleType === 'custom' && (
        <MilestoneForm 
          milestones={milestones}
          totalPercentage={totalPercentage}
          isPercentageValid={isPercentageValid}
          onAddMilestone={handleAddMilestone}
          onRemoveMilestone={handleRemoveMilestone}
          onMilestoneChange={handleMilestoneChange}
        />
      )}
      
      <WizardActions
        onBack={onBack}
        onNext={handleContinue}
        nextDisabled={!isPercentageValid || milestones.length === 0}
      />
    </div>
  );
}
