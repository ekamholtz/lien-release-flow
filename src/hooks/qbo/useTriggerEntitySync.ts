
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { useCompany } from '@/contexts/CompanyContext';

interface TriggerSyncResult {
  entityType: string;
  queued: number;
  error?: string;
}

interface TriggerSyncResponse {
  success: boolean;
  entityType: string;
  results: TriggerSyncResult[];
  totalQueued: number;
}

export function useTriggerEntitySync() {
  const [isTriggering, setIsTriggering] = useState(false);
  const { session } = useSessionRefresh();
  const { currentCompany } = useCompany();

  const triggerSync = async (entityType: string, batchSize: number = 50): Promise<TriggerSyncResponse | null> => {
    if (!session?.access_token || !currentCompany?.id) {
      toast.error('Please ensure you are signed in and have selected a company');
      return null;
    }

    try {
      setIsTriggering(true);
      
      console.log('Triggering sync for:', { entityType, batchSize, companyId: currentCompany.id });

      const response = await fetch(
        'https://oknofqytitpxmlprvekn.functions.supabase.co/trigger-entity-sync',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            companyId: currentCompany.id,
            entityType,
            batchSize
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync trigger failed: ${errorText}`);
      }

      const result: TriggerSyncResponse = await response.json();
      
      if (result.success) {
        toast.success(`Successfully queued ${result.totalQueued} items for sync`);
        return result;
      } else {
        toast.error('Sync trigger failed');
        return null;
      }

    } catch (error: any) {
      console.error('Error triggering sync:', error);
      toast.error(`Failed to trigger sync: ${error.message}`);
      return null;
    } finally {
      setIsTriggering(false);
    }
  };

  const triggerBulkSync = async (batchSize: number = 50) => {
    return await triggerSync('all', batchSize);
  };

  const triggerEntityTypeSync = async (entityType: string, batchSize: number = 50) => {
    return await triggerSync(entityType, batchSize);
  };

  return {
    triggerBulkSync,
    triggerEntityTypeSync,
    isTriggering
  };
}
