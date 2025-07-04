
import { SyncStatistics, EntityStats } from "./useSyncStatistics";

export function useSyncStatsCalculations() {
  const calculateTotals = (statistics: SyncStatistics[]): EntityStats => {
    return statistics.reduce((acc, stat) => ({
      total: acc.total + stat.total_count,
      success: acc.success + stat.success_count,
      error: acc.error + stat.error_count,
      pending: acc.pending + stat.pending_count,
      processing: acc.processing + stat.processing_count
    }), { total: 0, success: 0, error: 0, pending: 0, processing: 0 });
  };

  const calculateByEntityType = (statistics: SyncStatistics[]): Record<string, EntityStats> => {
    const byEntityType: Record<string, EntityStats> = {};
    
    statistics.forEach(stat => {
      const entityType = stat.entity_type;
      if (!byEntityType[entityType]) {
        byEntityType[entityType] = { 
          total: 0, 
          success: 0, 
          error: 0, 
          pending: 0, 
          processing: 0 
        };
      }
      
      const entityStats = byEntityType[entityType];
      entityStats.total += stat.total_count;
      entityStats.success += stat.success_count;
      entityStats.error += stat.error_count;
      entityStats.pending += stat.pending_count;
      entityStats.processing += stat.processing_count;
    });

    return byEntityType;
  };

  return {
    calculateTotals,
    calculateByEntityType
  };
}
