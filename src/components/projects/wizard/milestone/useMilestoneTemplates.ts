
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MilestoneTemplate } from '@/types/project';
import { toast } from 'sonner';

export function useMilestoneTemplates(projectTypeId?: string) {
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMilestoneTemplates();
  }, [projectTypeId]);
  
  const fetchMilestoneTemplates = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('milestone_templates')
        .select('*');
      
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

  const applyTemplate = (
    templateId: string,
    projectValue: number,
    setMilestones: (milestones: any[]) => void
  ) => {
    if (!templateId) return;
    
    try {
      const template = templates.find(t => t.id === templateId);
      
      if (!template || !template.template_data || !template.template_data.milestones) {
        toast.error('Invalid template data');
        return;
      }
      
      const templateMilestones = template.template_data.milestones.map(m => {
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

  return {
    templates,
    isLoading,
    fetchMilestoneTemplates,
    applyTemplate
  };
}
