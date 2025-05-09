import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DbChangeOrder } from '@/lib/supabase';

interface Milestone {
  id?: string;
  name: string;
  percentage: number;
  amount: number;
  description?: string;
  status: 'pending' | 'completed';
}

interface ChangeOrderFormData {
  description: string;
  amount: number;
  milestones: Milestone[];
}

export function useChangeOrderWizard(projectId?: string | null) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ChangeOrderFormData>({
    description: '',
    amount: 0,
    milestones: []
  });

  const updateFormData = (data: Partial<ChangeOrderFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const submitChangeOrder = async () => {
    if (!projectId || !user) {
      toast.error('Missing project ID or user information');
      return false;
    }

    // Validate milestones total percentage
    const totalPercentage = formData.milestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
    if (totalPercentage !== 100) {
      toast.error('Total milestone percentage must equal 100%');
      return false;
    }

    setIsSubmitting(true);

    try {
      // Get current project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('value')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Now that we've added the change_orders table to the Database type, we can use it directly
      const { data: changeOrderResult, error: changeOrderError } = await supabase
        .from('change_orders')
        .insert({
          project_id: projectId,
          description: formData.description,
          amount: formData.amount,
          status: 'approved',
          created_by: user.id,
          date: new Date().toISOString()
        })
        .select('id')
        .single();
        
      // Extract the change order ID from the result
      const changeOrderId = changeOrderResult?.id;

      if (changeOrderError) throw changeOrderError;

      // Update project value
      const newValue = project.value + formData.amount;
      const { error: valueUpdateError } = await supabase
        .from('projects')
        .update({ value: newValue })
        .eq('id', projectId);

      if (valueUpdateError) throw valueUpdateError;

      // Delete existing pending milestones
      const { error: deleteMilestonesError } = await supabase
        .from('milestones')
        .delete()
        .eq('project_id', projectId)
        .eq('status', 'pending');

      if (deleteMilestonesError) throw deleteMilestonesError;

      // Insert new milestones
      if (formData.milestones.length > 0) {
        const milestonesToInsert = formData.milestones.map(milestone => ({
          project_id: projectId,
          name: milestone.name,
          percentage: milestone.percentage,
          amount: milestone.amount,
          description: milestone.description || null,
          status: 'pending',
          change_order_id: changeOrderId
        }));

        const { error: insertMilestonesError } = await supabase
          .from('milestones')
          .insert(milestonesToInsert);

        if (insertMilestonesError) throw insertMilestonesError;
      }

      toast.success('Change order created successfully');
      return true;
    } catch (error: any) {
      console.error('Error creating change order:', error);
      toast.error(`Failed to create change order: ${error.message}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    updateFormData,
    isSubmitting,
    submitChangeOrder
  };
}

export default useChangeOrderWizard;
