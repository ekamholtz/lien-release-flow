
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
      
      // Get the user's company
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (!companyMember?.company_id) {
        console.warn('No active company membership found');
        return;
      }

      // Use the new comprehensive sync statistics function
      const { data: comprehensiveStats, error } = await supabase
        .rpc('get_sync_statistics', { p_company_id: companyMember.company_id });

      if (error) throw error;

      // Aggregate the stats for backward compatibility
      const stats = (comprehensiveStats || []).reduce((acc, stat) => ({
        total: acc.total + Number(stat.total_count),
        synced: acc.synced + Number(stat.success_count),
        failed: acc.failed + Number(stat.error_count),
        pending: acc.pending + Number(stat.pending_count) + Number(stat.processing_count)
      }), { total: 0, synced: 0, failed: 0, pending: 0 });

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
