
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
  const { session, refreshSession } = useSessionRefresh();

  const fetchSyncStats = async () => {
    if (!session?.user?.id) {
      console.log('No session or user ID available for sync stats');
      return;
    }
    
    try {
      setIsRefreshingStats(true);
      console.log('Fetching sync stats for user:', session.user.id);
      
      // Get the user's company first
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

      // Query accounting_sync table by company through related entities
      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('status')
        .or(`entity_type.in.("invoice","bill","vendor","payment")`);

      if (error) {
        console.error('Sync stats query error:', error);
        throw error;
      }

      // Calculate the stats
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

      console.log('Sync stats calculated:', stats);
      setSyncStats(stats);
    } catch (err) {
      console.error('Error fetching sync stats:', err);
      toast.error('Failed to load QBO sync statistics');
    } finally {
      setIsRefreshingStats(false);
    }
  };

  const handleRetryFailedSyncs = async () => {
    if (!session?.access_token) {
      console.error('No access token available for retry');
      toast.error('Please sign in to retry failed syncs');
      return;
    }
    
    try {
      console.log('Retrying failed QBO syncs...');
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
          console.log(`Calling ${endpoint}...`);
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
            console.log(`${endpoint} processed:`, result.processed || 0);
          } else {
            console.error(`${endpoint} failed:`, response.status, await response.text());
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
      
      // Refresh stats after a delay
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
      console.log('Session available, fetching sync stats');
      fetchSyncStats();
    } else {
      console.log('No session available for sync stats');
    }
  }, [session?.user?.id]);

  return {
    syncStats,
    isRefreshingStats,
    fetchSyncStats,
    handleRetryFailedSyncs
  };
}
