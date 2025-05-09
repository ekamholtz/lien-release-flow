
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

    setIsSubmitting(true);

    try {
      // First, get the current project value
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('value')
        .eq('id', projectId)
        .single();

      if (projectError) {
        toast.error('Failed to load project information');
        return false;
      }

      const originalValue = Number(project.value) || 0;
      const changeAmount = Number(formData.amount) || 0;
      const newTotalValue = originalValue + changeAmount;

      // Validate that milestones total matches the expected value
      const totalMilestoneAmount = formData.milestones.reduce(
        (sum, m) => sum + (typeof m.amount === 'number' ? m.amount : Number(m.amount) || 0),
        0
      );

      // Allow a small rounding error (0.01)
      if (Math.abs(totalMilestoneAmount - newTotalValue) > 0.01) {
        toast.error(`Total milestone amount ($${totalMilestoneAmount.toFixed(2)}) must equal the new contract value ($${newTotalValue.toFixed(2)})`);
        setIsSubmitting(false);
        return false;
      }

      console.log('=== STARTING CHANGE ORDER SUBMISSION ===');
      console.log('Validation passed. Processing change order with new value:', newTotalValue);

      // Step 1: Create the change order record
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

      if (changeOrderError) {
        console.error('Error creating change order:', changeOrderError);
        toast.error(`Failed to create change order: ${changeOrderError.message}`);
        setIsSubmitting(false);
        return false;
      }

      console.log('Created change order:', changeOrderResult);

      // Step 2: Fetch current milestones
      const { data: existingMilestones, error: fetchError } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId);

      if (fetchError) {
        console.error('Error fetching milestones:', fetchError);
        toast.error(`Failed to fetch current milestones: ${fetchError.message}`);
        setIsSubmitting(false);
        return false;
      }

      console.log('Existing milestones:', existingMilestones?.length || 0);

      // Step 3: Clear all non-completed milestones
      if (existingMilestones && existingMilestones.length > 0) {
        // Find all non-completed milestones that can be safely deleted
        // FIXED: Use is_completed field instead of status field to identify pending milestones
        const pendingMilestoneIds = existingMilestones
          .filter(m => m.is_completed === false)
          // .filter(m => !invoicedMilestoneIds.includes(m.id)) // Example placeholder for filtering out invoiced milestones
          .map(m => m.id);

        console.log('Non-completed milestone IDs to delete:', pendingMilestoneIds);

        if (pendingMilestoneIds.length > 0) {
          // Delete all pending milestones in one operation
          const { error: deleteError } = await supabase
            .from('milestones')
            .delete()
            .in('id', pendingMilestoneIds);

          if (deleteError) {
            console.error('Error deleting pending milestones:', deleteError);
            toast.error(`Failed to delete existing pending milestones: ${deleteError.message}. Change order process aborted.`);
            setIsSubmitting(false);
            return false; // Stop the process if deletion fails
          }
          console.log(`Successfully deleted ${pendingMilestoneIds.length} non-completed milestones`);
        }
      }

      // Step 4: Re-check remaining milestones
      const { data: remainingMilestones, error: remainingError } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId);

      if (remainingError) {
        console.error('Error checking remaining milestones:', remainingError);
      } else {
        console.log('Remaining milestones after deletion:', remainingMilestones?.length || 0);
      }

      // Step 5: Extract just the completed milestones from the remaining ones
      const completedMilestones = remainingMilestones?.filter(m => m.is_completed === true) || [];
      console.log('Completed milestones to preserve:', completedMilestones.length);

      // Step 6: Create the new pending milestones from the form data
      const pendingMilestonesToInsert = formData.milestones
        .filter(m => m.status === 'pending') // Ensure we only take pending from form
        .map(milestone => ({
          project_id: projectId,
          name: milestone.name,
          percentage: milestone.percentage, // Consider if this field is still relevant
          amount: milestone.amount,
          description: milestone.description || null,
          status: 'pending', // Explicitly set as pending
          change_order_id: changeOrderResult.id, // Link to the created change order
          due_type: 'event', // Set due_type to 'event' so the Complete button will appear
          is_completed: false // Explicitly set as not completed
        }));

      console.log('New pending milestones to insert:', pendingMilestonesToInsert.length);

      if (pendingMilestonesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('milestones')
          .insert(pendingMilestonesToInsert);

        if (insertError) {
          console.error('Error inserting new milestones:', insertError);
          toast.error(`Failed to create new milestones: ${insertError.message}`);
          setIsSubmitting(false);
          return false;
        }

        console.log('Successfully inserted new milestones');
      }

      // Step 7: Update the project value
      const { error: valueUpdateError } = await supabase
        .from('projects')
        .update({ value: newTotalValue })
        .eq('id', projectId);

      if (valueUpdateError) {
        console.error('Error updating project value:', valueUpdateError);
        toast.error(`Failed to update project value: ${valueUpdateError.message}`);
        setIsSubmitting(false);
        return false;
      }

      console.log('Successfully updated project value to:', newTotalValue);
      console.log('=== COMPLETED CHANGE ORDER SUBMISSION ===');

      toast.success('Change order created successfully');
      return true;
    } catch (error: any) {
      console.error('Error creating change order:', error);
      toast.error(`Failed to create change order: ${error.message}`);
      setIsSubmitting(false);
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
