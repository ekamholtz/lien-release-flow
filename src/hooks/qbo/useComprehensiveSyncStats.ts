
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

export interface ComprehensiveSyncStats {
  statistics: SyncStatistics[];
  totals: {
    total: number;
    success: number;
    error: number;
    pending: number;
    processing: number;
  };
  byEntityType: Record<string, {
    total: number;
    success: number;
    error: number;
    pending: number;
    processing: number;
  }>;
}

export function useComprehensiveSyncStats() {
  const [syncStats, setSyncStats] = useState<ComprehensiveSyncStats>({
    statistics: [],
    totals: { total: 0, success: 0, error: 0, pending: 0, processing: 0 },
    byEntityType: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSessionRefresh();

  const fetchSyncStats = async () => {
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

      // Call the new comprehensive sync statistics function
      const { data: stats, error } = await supabase
        .rpc('get_sync_statistics', { p_company_id: companyMember.company_id });

      if (error) throw error;

      const statistics = stats || [];
      
      // Calculate totals
      const totals = statistics.reduce((acc, stat) => ({
        total: acc.total + Number(stat.total_count),
        success: acc.success + Number(stat.success_count),
        error: acc.error + Number(stat.error_count),
        pending: acc.pending + Number(stat.pending_count),
        processing: acc.processing + Number(stat.processing_count)
      }), { total: 0, success: 0, error: 0, pending: 0, processing: 0 });

      // Group by entity type
      const byEntityType = statistics.reduce((acc, stat) => {
        if (!acc[stat.entity_type]) {
          acc[stat.entity_type] = { total: 0, success: 0, error: 0, pending: 0, processing: 0 };
        }
        
        acc[stat.entity_type].total += Number(stat.total_count);
        acc[stat.entity_type].success += Number(stat.success_count);
        acc[stat.entity_type].error += Number(stat.error_count);
        acc[stat.entity_type].pending += Number(stat.pending_count);
        acc[stat.entity_type].processing += Number(stat.processing_count);
        
        return acc;
      }, {} as Record<string, any>);

      setSyncStats({
        statistics,
        totals,
        byEntityType
      });
    } catch (err) {
      console.error('Error fetching comprehensive sync stats:', err);
      toast.error('Failed to load sync statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedSyncs = async (entityType?: string) => {
    if (!session?.access_token) return;
    
    try {
      toast.info(`Retrying failed ${entityType || 'all'} syncs...`);
      
      const endpoints = {
        invoice: 'sync-invoice',
        bill: 'sync-bill', 
        vendor: 'sync-vendor',
        payment: 'sync-payment'
      };
      
      const entitiesToRetry = entityType ? [entityType] : Object.keys(endpoints);
      
      for (const entity of entitiesToRetry) {
        if (endpoints[entity as keyof typeof endpoints]) {
          const response = await fetch(
            `https://oknofqytitpxmlprvekn.functions.supabase.co/${endpoints[entity as keyof typeof endpoints]}`,
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
            console.error(`Failed to retry ${entity} syncs:`, await response.text());
          }
        }
      }
      
      toast.success('Sync retry initiated');
      
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
    if (!session?.user) return;
    fetchSyncStats();
  }, [session]);

  return {
    syncStats,
    isLoading,
    fetchSyncStats,
    retryFailedSyncs
  };
}
