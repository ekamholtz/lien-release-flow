
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useQboActions() {
  const [isRetrySyncing, setIsRetrySyncing] = useState(false);

  const handleRetrySync = async (invoiceId: string) => {
    try {
      setIsRetrySyncing(true);
      
      const { error } = await supabase.functions.invoke('qbo-sync-retry', {
        body: { invoiceId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sync Retry Initiated",
        description: "The invoice sync has been queued for retry.",
      });
    } catch (error) {
      console.error('Error retrying sync:', error);
      toast({
        title: "Retry Failed",
        description: "Failed to retry sync. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRetrySyncing(false);
    }
  };

  return {
    handleRetrySync,
    isRetrySyncing
  };
}
