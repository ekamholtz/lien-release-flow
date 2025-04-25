
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

export interface QboSyncStats {
  total: number;
  synced: number;
  failed: number;
  pending: number;
}

export function useQboSyncStats() {
  const [syncStats, setSyncStats] = useState<QboSyncStats>({ 
    total: 0, 
    synced: 0, 
    failed: 0, 
    pending: 0 
  });
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const { session } = useSessionRefresh();

  const fetchSyncStats = async () => {
    if (!session?.user) return;
    
    try {
      setIsRefreshingStats(true);
      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('*')
        .eq('entity_type', 'invoice')
        .eq('provider', 'qbo');

      if (error) throw error;

      const stats = {
        total: syncRecords.length,
        synced: syncRecords.filter(rec => rec.status === 'success').length,
        failed: syncRecords.filter(rec => rec.status === 'error').length,
        pending: syncRecords.filter(rec => ['pending', 'processing'].includes(rec.status || '')).length
      };

      setSyncStats(stats);
    } catch (err) {
      console.error('Error fetching sync stats:', err);
      toast.error('Failed to load QBO sync statistics');
    } finally {
      setIsRefreshingStats(false);
    }
  };

  const handleRetryFailedSyncs = async () => {
    if (!session?.access_token) return;
    
    try {
      toast.info('Retrying failed QBO syncs...');
      
      const response = await fetch(
        'https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-sync-retry',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({})
        }
      );
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to trigger retry: ${error}`);
      }
      
      const result = await response.json();
      
      if (result.processed > 0) {
        toast.success(`Scheduled retry for ${result.processed} failed syncs`);
      } else {
        toast.info('No failed syncs found to retry');
      }
      
      setTimeout(() => {
        fetchSyncStats();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error retrying syncs:', err);
      toast.error(`Retry error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchSyncStats();
  }, [session]);

  return {
    syncStats,
    isRefreshingStats,
    fetchSyncStats,
    handleRetryFailedSyncs
  };
}
