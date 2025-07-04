
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProjectCustomerSync() {
  const [isLoading, setIsLoading] = useState(false);

  const syncProjectCustomer = async (projectId: string) => {
    setIsLoading(true);
    try {
      console.log('Starting project-customer sync for:', projectId);

      const { data, error } = await supabase.functions.invoke('sync-project-customer', {
        body: { project_id: projectId }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync project with QBO');
      }

      toast.success('Project successfully synced with QuickBooks Online');
      
      return {
        success: true,
        qbo_customer_id: data.qbo_customer_id,
        qbo_job_id: data.qbo_job_id
      };
    } catch (error: any) {
      console.error('Error syncing project-customer:', error);
      const errorMessage = error.message || 'Failed to sync project with QBO';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncProjectCustomer,
    isLoading
  };
}
