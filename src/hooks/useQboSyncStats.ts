
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
    if (!session?.user?.id) return;
    
    try {
      setIsRefreshingStats(true);
      
      // Query accounting_sync table directly by user_id since it doesn't have company_id
      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('status')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Sync stats query error:', error);
        throw error;
      }

      // Calculate the stats with explicit typing
      const stats: QboSyncStats = {
        total: 0,
        synced: 0,
        failed: 0,
        pending: 0
      };
      
      if (syncRecords && Array.isArray(syncRecords)) {
        for (const record of syncRecords) {
          stats.total++;
          
          if (record.status === 'success') {
            stats.synced++;
          } else if (record.status === 'error') {
            stats.failed++;
          } else if (record.status === 'pending' || record.status === 'processing') {
            stats.pending++;
          }
        }
      }

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
      
      const endpoints = [
        'qbo-sync-retry',
        'qbo-bill-sync-retry', 
        'qbo-vendor-sync-retry',
        'qbo-payment-sync-retry'
      ];
      
      let totalProcessed = 0;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(
            `https://oknofqytitpxmlprvekn.functions.supabase.co/${endpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({})
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            totalProcessed += result.processed || 0;
          }
        } catch (endpointError) {
          console.error(`Error with ${endpoint}:`, endpointError);
        }
      }
      
      if (totalProcessed > 0) {
        toast.success(`Scheduled retry for ${totalProcessed} failed syncs`);
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
    if (session?.user?.id) {
      fetchSyncStats();
    }
  }, [session?.user?.id]);

  return {
    syncStats,
    isRefreshingStats,
    fetchSyncStats,
    handleRetryFailedSyncs
  };
}
