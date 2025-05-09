
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { MilestoneScheduleSelector } from './milestone/MilestoneScheduleSelector';
import { MilestoneTemplateSelector } from './milestone/MilestoneTemplateSelector';
import { MilestoneForm } from './milestone/MilestoneForm';
import { useMilestoneTemplates } from './milestone/useMilestoneTemplates';
import { WizardActions } from './WizardActions';

// Helper function for consistent currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

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
  
  // Calculate total amount and percentages - ensure numeric addition
  const totalCalculations = useMemo(() => {
    // Ensure we're adding numbers, not concatenating strings
    const totalAmount = milestones.reduce((total, milestone) => {
      // Convert amount to number if it's a string
      const amount = typeof milestone.amount === 'number' 
        ? milestone.amount 
        : parseFloat(milestone.amount as any) || 0;
      return total + amount;
    }, 0);
    
    const totalPercentage = projectValue > 0 ? (totalAmount / projectValue) * 100 : 0;
    
    // Check if amounts are valid (allow small floating point error)
    const isValid = Math.abs(totalAmount - projectValue) < 0.01;
    
    return {
      totalAmount,
      totalPercentage: parseFloat(totalPercentage.toFixed(2)),
      isValid
    };
  }, [milestones, projectValue]);
  
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
      // Ensure percentage is a number
      const percentage = parseFloat(value) || 0;
      // Calculate amount based on percentage
      const amount = (percentage / 100) * projectValue;
      
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        percentage, // Store as number
        amount: Number(amount.toFixed(2)), // Ensure it's stored as a number with 2 decimal places
      };
    }
    // If changing amount, update the percentage
    else if (field === 'amount' && projectValue > 0) {
      // Ensure amount is a number
      const amount = parseFloat(value) || 0;
      // Calculate percentage based on amount
      const percentage = projectValue > 0 ? (amount / projectValue) * 100 : 0;
      
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        amount: Number(amount.toFixed(2)), // Ensure it's stored as a number with 2 decimal places
        percentage: Number(percentage.toFixed(2)), // Ensure it's stored as a number with 2 decimal places
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
    
    // Check total amount matches project value
    if (!totalCalculations.isValid) {
      toast.error(`Total milestone amount must equal the project value of ${formatCurrency(projectValue)}`);
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
          totalPercentage={totalCalculations.totalPercentage}
          projectValue={projectValue}
          onApplyTemplate={handleApplyTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
        />
      )}
      
      {scheduleType === 'custom' && (
        <>
          <MilestoneForm 
            milestones={milestones}
            totalPercentage={totalCalculations.totalPercentage}
            isPercentageValid={totalCalculations.isValid}
            onAddMilestone={handleAddMilestone}
            onRemoveMilestone={handleRemoveMilestone}
            onMilestoneChange={handleMilestoneChange}
          />
          
          {/* Show dollar validation warning */}
          {milestones.length > 0 && !totalCalculations.isValid && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mt-4">
              <p className="text-yellow-800">
                <strong>Warning:</strong> Total milestone amount is {formatCurrency(totalCalculations.totalAmount)} 
                ({totalCalculations.totalPercentage.toFixed(2)}% of the project value).
                It should equal {formatCurrency(projectValue)} (100%).
              </p>
              <p className="text-red-600 text-sm mt-2">
                {totalCalculations.totalAmount < projectValue
                  ? `You need to add ${formatCurrency(projectValue - totalCalculations.totalAmount)} more to reach the total project value`
                  : `You are ${formatCurrency(totalCalculations.totalAmount - projectValue)} over the total project value`}
              </p>
            </div>
          )}
        </>
      )}
      
      <WizardActions
        onBack={onBack}
        onNext={handleContinue}
        nextDisabled={!totalCalculations.isValid || milestones.length === 0}
      />
    </div>
  );
}
