
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

      // Get sync statistics directly from accounting_sync table
      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('*')
        .eq('company_id', companyMember.company_id);

      if (error) throw error;

      // Aggregate the stats for backward compatibility
      const initialStats = { total: 0, synced: 0, failed: 0, pending: 0 };
      
      const stats = (syncRecords || []).reduce<QboSyncStats>((acc, record) => {
        return {
          total: acc.total + 1,
          synced: acc.synced + (record.status === 'success' ? 1 : 0),
          failed: acc.failed + (record.status === 'error' ? 1 : 0),
          pending: acc.pending + (record.status === 'pending' || record.status === 'processing' ? 1 : 0)
        };
      }, initialStats);

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
