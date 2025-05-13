
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Milestone } from '../ProjectMilestones';
import { AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MilestoneFormProps {
  milestones: Milestone[];
  totalPercentage: number;
  isPercentageValid: boolean;
  onAddMilestone: () => void;
  onRemoveMilestone: (index: number) => void;
  onMilestoneChange: (index: number, field: keyof Milestone, value: any) => void;
}

export function MilestoneForm({
  milestones,
  totalPercentage,
  isPercentageValid,
  onAddMilestone,
  onRemoveMilestone,
  onMilestoneChange
}: MilestoneFormProps) {
  if (milestones.length === 0) {
    return (
      <>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
          <h3 className="text-sm font-medium">No milestones added</h3>
          <p className="text-xs text-gray-500 mt-1">Add payment milestones to create a payment schedule</p>
        </div>
          
        <Button
          type="button"
          variant="outline"
          onClick={onAddMilestone}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Milestone
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Milestones</h4>
          <div className="text-sm">
            Total: {totalPercentage.toFixed(2)}%
            {!isPercentageValid && (
              <span className="text-red-500 ml-2">
                (Must equal 100%)
              </span>
            )}
          </div>
        </div>
        
        <Progress 
          value={totalPercentage} 
          className={cn(
            "h-2 shadow-sm",
            !isPercentageValid && totalPercentage > 100 ? "bg-red-100 border-red-200" : ""
          )}
          indicatorClassName={cn(
            totalPercentage === 100 ? "bg-green-500" : "",
            !isPercentageValid && totalPercentage > 100 ? "bg-red-500" : "",
            totalPercentage > 0 && totalPercentage < 100 ? "bg-blue-500" : ""
          )}
        />
        
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <MilestoneCard
              key={index}
              milestone={milestone}
              index={index}
              onRemove={onRemoveMilestone}
              onChange={onMilestoneChange}
            />
          ))}
        </div>
      </div>
      
      <Button
        type="button"
        variant="outline"
        onClick={onAddMilestone}
        className="w-full mt-4"
      >
        <Plus className="h-4 w-4 mr-2" /> Add Milestone
      </Button>
    </>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof Milestone, value: any) => void;
}

function MilestoneCard({ milestone, index, onRemove, onChange }: MilestoneCardProps) {
  return (
    <Card key={index} className="p-4">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-medium">Milestone {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor={`milestone-name-${index}`}>Name</Label>
          <Input
            id={`milestone-name-${index}`}
            value={milestone.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="e.g., Foundation Complete"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`milestone-due-type-${index}`}>Due Type</Label>
          <Select 
            value={milestone.dueType} 
            onValueChange={(value: 'time' | 'event') => onChange(index, 'dueType', value)}
          >
            <SelectTrigger id={`milestone-due-type-${index}`}>
              <SelectValue placeholder="Select due type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">Time-based</SelectItem>
              <SelectItem value="event">Event-based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {milestone.dueType === 'time' && (
          <div className="space-y-2">
            <Label htmlFor={`milestone-date-${index}`}>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={`milestone-date-${index}`}
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !milestone.dueDate && "text-muted-foreground"
                  )}
                >
                  {milestone.dueDate ? (
                    format(milestone.dueDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={milestone.dueDate || undefined}
                  onSelect={(date) => onChange(index, 'dueDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor={`milestone-percentage-${index}`}>Percentage (%)</Label>
          <Input
            id={`milestone-percentage-${index}`}
            type="number"
            value={milestone.percentage || ''}
            onChange={(e) => onChange(index, 'percentage', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`milestone-amount-${index}`}>Amount ($)</Label>
          <Input
            id={`milestone-amount-${index}`}
            type="number"
            value={milestone.amount}
            onChange={(e) => onChange(index, 'amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`milestone-description-${index}`}>Description (Optional)</Label>
        <Textarea
          id={`milestone-description-${index}`}
          value={milestone.description || ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Enter a description for this milestone"
        />
      </div>
    </Card>
  );
}
