
import { useSyncStatistics, SyncStatistics, EntityStats } from "./useSyncStatistics";
import { useSyncRetry } from "./useSyncRetry";
import { useSyncStatsCalculations } from "./useSyncStatsCalculations";

export interface ComprehensiveSyncStats {
  statistics: SyncStatistics[];
  totals: EntityStats;
  byEntityType: Record<string, EntityStats>;
}

export function useComprehensiveSyncStats() {
  const { statistics, isLoading, fetchSyncStatistics } = useSyncStatistics();
  const { retryFailedSyncs } = useSyncRetry();
  const { calculateTotals, calculateByEntityType } = useSyncStatsCalculations();

  const syncStats: ComprehensiveSyncStats = {
    statistics,
    totals: calculateTotals(statistics),
    byEntityType: calculateByEntityType(statistics)
  };

  const refreshStats = () => {
    setTimeout(() => {
      fetchSyncStatistics();
    }, 2000);
  };

  const handleRetryFailedSyncs = async (entityType?: string) => {
    await retryFailedSyncs(entityType);
    refreshStats();
  };

  return {
    syncStats,
    isLoading,
    fetchSyncStats: fetchSyncStatistics,
    retryFailedSyncs: handleRetryFailedSyncs
  };
}

// Re-export types for backward compatibility
export type { SyncStatistics, EntityStats };
