
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Milestone } from '@/components/projects/ProjectWizard';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { toast } from 'sonner';

interface ProjectMilestonesProps {
  initialMilestones: Milestone[];
  projectTypeId?: string;
  onBack: () => void;
  onSubmit: (milestones: Milestone[]) => void;
}

export function ProjectMilestones({ 
  initialMilestones, 
  projectTypeId, 
  onBack, 
  onSubmit 
}: ProjectMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones || []);
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
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
      },
    ]);
  };
  
  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };
  
  const handleMilestoneChange = (index: number, field: keyof Milestone, value: any) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    };
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
      
      const templateMilestones: Milestone[] = template.template_data.milestones.map(m => ({
        name: m.name,
        amount: m.amount || 0,
        percentage: m.percentage || 0,
        description: '',
        dueDate: null,
      }));
      
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
    
    onSubmit(milestones);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Milestones</h3>
        <p className="text-sm text-muted-foreground">
          Define payment milestones for this project or apply a template.
        </p>
      </div>
      
      {templates.length > 0 && (
        <div className="flex gap-4 items-end">
          <div className="flex-grow">
            <Label htmlFor="template-select">Apply Template</Label>
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
          <Button 
            type="button" 
            onClick={handleApplyTemplate} 
            disabled={!selectedTemplate}
            className="mb-0.5"
          >
            Apply Template
          </Button>
        </div>
      )}
      
      {milestones.length > 0 ? (
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
                  <Label htmlFor={`milestone-date-${index}`}>Due Date (Optional)</Label>
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
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={milestone.dueDate || undefined}
                        onSelect={(date) => handleMilestoneChange(index, 'dueDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center">
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
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          type="button" 
          onClick={handleContinue}
          disabled={milestones.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
