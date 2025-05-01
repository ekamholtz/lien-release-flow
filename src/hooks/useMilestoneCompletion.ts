
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DbMilestone } from '@/lib/supabase';

interface UseMilestoneCompletionOptions {
  onSuccess?: () => void;
}

export function useMilestoneCompletion(options?: UseMilestoneCompletionOptions) {
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const completeMilestone = async (milestone: DbMilestone) => {
    if (milestone.is_completed) {
      toast.error("Milestone is already completed");
      return;
    }

    // Only event-based milestones can be manually completed
    if (milestone.due_type !== 'event') {
      toast.error("Only event-based milestones can be manually completed");
      return;
    }

    try {
      setIsCompleting(true);

      // Update the milestone as completed
      const completedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('milestones')
        .update({
          is_completed: true,
          status: 'completed',
          completed_at: completedAt
        })
        .eq('id', milestone.id);

      if (updateError) throw updateError;

      // Create an invoice for the milestone
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

      // Get project details for the invoice
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client, contact_email')
        .eq('id', milestone.project_id)
        .single();

      if (projectError) throw projectError;

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_name: project.client,
          client_email: project.contact_email || '',
          project_id: milestone.project_id,
          amount: milestone.amount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'draft',
          source_milestone_id: milestone.id
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Log the milestone completion
      await supabase
        .from('milestone_logs')
        .insert({
          milestone_id: milestone.id,
          action: 'completed',
          system_generated: false,
          metadata: {
            invoice_id: invoice.id
          }
        });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project-milestones', milestone.project_id] });
      
      toast.success("Milestone completed successfully. Invoice created.");
      
      if (options?.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      console.error("Error completing milestone:", error);
      toast.error("Failed to complete milestone");
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    completeMilestone,
    isCompleting
  };
}
