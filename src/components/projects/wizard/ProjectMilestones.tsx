
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { MilestoneTemplate } from '@/types/project';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

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
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'template' | 'custom'>(initialMilestones.length > 0 ? 'custom' : 'template');
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return milestones.reduce((total, milestone) => total + (milestone.percentage || 0), 0);
  }, [milestones]);

  // Calculate if percentages are valid
  const isPercentageValid = useMemo(() => {
    return Math.abs(totalPercentage - 100) < 0.01; // Allow small floating point error
  }, [totalPercentage]);
  
  useEffect(() => {
    fetchMilestoneTemplates();
  }, [projectTypeId]);
  
  const fetchMilestoneTemplates = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('milestone_templates')
        .select('*')
      
      if (projectTypeId) {
        // If we have a project type, get templates for that type or generic ones
        query = query.or(`project_type_id.eq.${projectTypeId},project_type_id.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our MilestoneTemplate type
      const transformedData: MilestoneTemplate[] = (data || []).map(item => ({
        ...item,
        template_data: typeof item.template_data === 'string' 
          ? JSON.parse(item.template_data) 
          : item.template_data
      }));
      
      setTemplates(transformedData);
    } catch (error) {
      console.error('Error fetching milestone templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (!template || !template.template_data || !template.template_data.milestones) {
        toast.error('Invalid template data');
        return;
      }
      
      const templateMilestones: Milestone[] = template.template_data.milestones.map(m => {
        // Calculate amount based on percentage and project value
        const percentage = m.percentage || 0;
        const amount = (percentage / 100) * projectValue;
        
        return {
          name: m.name,
          amount,
          percentage,
          description: m.description || '',
          dueDate: null,
          dueType: 'time',
        };
      });
      
      setMilestones(templateMilestones);
      toast.success('Template applied successfully');
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
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
  
  const handleDuplicateTemplate = () => {
    if (selectedTemplate && milestones.length > 0) {
      // Create a custom copy of the current milestones
      setScheduleType('custom');
      toast.success('Template duplicated for custom editing');
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Define payment milestones for this project using a template or custom schedule.
        </p>
      </div>
      
      <RadioGroup 
        value={scheduleType} 
        onValueChange={(value: 'template' | 'custom') => setScheduleType(value)}
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
      
      {scheduleType === 'template' && (
        <div className="space-y-4">
          {templates.length > 0 ? (
            <>
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
                    onClick={handleApplyTemplate} 
                    disabled={!selectedTemplate}
                    className="mb-0.5"
                  >
                    Apply Template
                  </Button>
                  {milestones.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDuplicateTemplate}
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
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium">No templates available</h3>
              <p className="text-xs text-gray-500 mt-1">Create custom payment schedule instead</p>
            </div>
          )}
        </div>
      )}
      
      {scheduleType === 'custom' && (
        <>
          {milestones.length > 0 ? (
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
                  "h-2",
                  !isPercentageValid && totalPercentage > 100 ? "bg-red-200" : ""
                )}
                indicatorClassName={cn(
                  !isPercentageValid && totalPercentage > 100 ? "bg-red-500" : ""
                )}
              />
              
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Milestone {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMilestone(index)}
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
                          onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                          placeholder="e.g., Foundation Complete"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-due-type-${index}`}>Due Type</Label>
                        <Select 
                          value={milestone.dueType} 
                          onValueChange={(value: 'time' | 'event') => handleMilestoneChange(index, 'dueType', value)}
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
                                onSelect={(date) => handleMilestoneChange(index, 'dueDate', date)}
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
                          onChange={(e) => handleMilestoneChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-amount-${index}`}>Amount ($)</Label>
                        <Input
                          id={`milestone-amount-${index}`}
                          type="number"
                          value={milestone.amount}
                          onChange={(e) => handleMilestoneChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`milestone-description-${index}`}>Description (Optional)</Label>
                      <Textarea
                        id={`milestone-description-${index}`}
                        value={milestone.description || ''}
                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                        placeholder="Enter a description for this milestone"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium">No milestones added</h3>
              <p className="text-xs text-gray-500 mt-1">Add payment milestones to create a payment schedule</p>
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAddMilestone}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Milestone
          </Button>
        </>
      )}
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          type="button" 
          onClick={handleContinue}
          disabled={!isPercentageValid || milestones.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
