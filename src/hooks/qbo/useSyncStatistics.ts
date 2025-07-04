
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

export interface SyncStatistics {
  entity_type: string;
  provider: string;
  total_count: number;
  success_count: number;
  error_count: number;
  pending_count: number;
  processing_count: number;
  last_sync_date: string | null;
}

export interface EntityStats {
  total: number;
  success: number;
  error: number;
  pending: number;
  processing: number;
}

export function useSyncStatistics() {
  const [statistics, setStatistics] = useState<SyncStatistics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSessionRefresh();

  const fetchSyncStatistics = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      
      // Get the user's company
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (!companyMember?.company_id) {
        throw new Error('No active company membership found');
      }

      // Get comprehensive sync statistics directly from the accounting_sync table
      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('*')
        .eq('company_id', companyMember.company_id);

      if (error) throw error;

      // Process the data to create statistics
      const statsMap = new Map<string, SyncStatistics>();

      (syncRecords || []).forEach(record => {
        const key = `${record.entity_type}-${record.provider}`;
        
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            entity_type: record.entity_type,
            provider: record.provider,
            total_count: 0,
            success_count: 0,
            error_count: 0,
            pending_count: 0,
            processing_count: 0,
            last_sync_date: null
          });
        }

        const stat = statsMap.get(key)!;
        stat.total_count++;
        
        switch (record.status) {
          case 'success':
            stat.success_count++;
            break;
          case 'error':
            stat.error_count++;
            break;
          case 'pending':
            stat.pending_count++;
            break;
          case 'processing':
            stat.processing_count++;
            break;
        }

        // Update last sync date
        if (record.last_synced_at && (!stat.last_sync_date || record.last_synced_at > stat.last_sync_date)) {
          stat.last_sync_date = record.last_synced_at;
        }
      });

      setStatistics(Array.from(statsMap.values()));
    } catch (err) {
      console.error('Error fetching sync stats:', err);
      toast.error('Failed to load sync statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchSyncStatistics();
  }, [session]);

  return {
    statistics,
    isLoading,
    fetchSyncStatistics
  };
}
