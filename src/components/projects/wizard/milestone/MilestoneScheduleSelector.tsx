
import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MilestoneScheduleSelectorProps {
  scheduleType: 'template' | 'custom';
  onScheduleTypeChange: (value: 'template' | 'custom') => void;
}

export function MilestoneScheduleSelector({ 
  scheduleType, 
  onScheduleTypeChange 
}: MilestoneScheduleSelectorProps) {
  return (
    <RadioGroup 
      value={scheduleType} 
      onValueChange={(value: 'template' | 'custom') => onScheduleTypeChange(value)}
      className="flex flex-col sm:flex-row gap-4 mb-6"
    >
      <div className={cn(
        "flex items-center space-x-2 border rounded-md p-4 cursor-pointer transition-colors",
        scheduleType === 'template' ? "border-primary bg-primary/5" : "border-muted"
      )}>
        <RadioGroupItem value="template" id="template" />
        <Label htmlFor="template" className="cursor-pointer font-medium">Use Template</Label>
      </div>
      <div className={cn(
        "flex items-center space-x-2 border rounded-md p-4 cursor-pointer transition-colors",
        scheduleType === 'custom' ? "border-primary bg-primary/5" : "border-muted"
      )}>
        <RadioGroupItem value="custom" id="custom" />
        <Label htmlFor="custom" className="cursor-pointer font-medium">Custom Schedule</Label>
      </div>
    </RadioGroup>
  );
}
