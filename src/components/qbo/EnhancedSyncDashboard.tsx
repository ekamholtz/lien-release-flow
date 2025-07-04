
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Loader2, TrendingUp, Play } from "lucide-react";
import { useComprehensiveSyncStats } from "@/hooks/qbo/useComprehensiveSyncStats";
import { useTriggerEntitySync } from "@/hooks/qbo/useTriggerEntitySync";
import { format } from "date-fns";

export function EnhancedSyncDashboard() {
  const { syncStats, isLoading, fetchSyncStats, retryFailedSyncs } = useComprehensiveSyncStats();
  const { triggerBulkSync, triggerEntityTypeSync, isTriggering } = useTriggerEntitySync();

  const getStatusBadge = (status: string, count: number) => {
    if (count === 0) return null;
    
    const variants = {
      success: "default",
      error: "destructive", 
      pending: "secondary",
      processing: "outline"
    } as const;

    const icons = {
      success: CheckCircle,
      error: AlertTriangle,
      pending: Clock,
      processing: Loader2
    };

    const Icon = icons[status as keyof typeof icons];
    
    return (
      <Badge variant={variants[status as keyof typeof variants]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {count}
      </Badge>
    );
  };

  const getSuccessRate = (success: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((success / total) * 100);
  };

  const capitalizeEntityType = (entityType: string) => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's';
  };

  const handleTriggerSync = async (entityType?: string) => {
    let result;
    if (entityType) {
      result = await triggerEntityTypeSync(entityType);
    } else {
      result = await triggerBulkSync();
    }
    
    if (result) {
      // Refresh stats after triggering sync
      setTimeout(() => {
        fetchSyncStats();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats.totals.total}</div>
            <p className="text-xs text-muted-foreground">Across all entities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getSuccessRate(syncStats.totals.success, syncStats.totals.total)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStats.totals.success} successful syncs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{syncStats.totals.error}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {syncStats.totals.pending + syncStats.totals.processing}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting sync</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync Controls</CardTitle>
          <CardDescription>
            Manually trigger sync operations for specific entity types or all entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleTriggerSync()}
              disabled={isTriggering}
              className="gap-2"
            >
              {isTriggering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Sync All Entities
            </Button>
            
            {Object.keys(syncStats.byEntityType).map((entityType) => (
              <Button
                key={entityType}
                variant="outline"
                onClick={() => handleTriggerSync(entityType)}
                disabled={isTriggering}
                className="gap-2"
              >
                {isTriggering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Sync {capitalizeEntityType(entityType)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entity Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sync Statistics by Entity Type</CardTitle>
            <CardDescription>
              Detailed breakdown of sync status for each entity type
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSyncStats}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {syncStats.totals.error > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => retryFailedSyncs()}
              >
                Retry Failed Syncs
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(syncStats.byEntityType).map(([entityType, stats]) => {
              const progressValue = getSuccessRate(stats.success, stats.total);
              
              return (
                <div key={entityType} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{capitalizeEntityType(entityType)}</h4>
                    <div className="flex items-center gap-2">
                      {getStatusBadge('success', stats.success)}
                      {getStatusBadge('error', stats.error)}
                      {getStatusBadge('pending', stats.pending)}
                      {getStatusBadge('processing', stats.processing)}
                      {stats.error > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryFailedSyncs(entityType)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span>{progressValue}% ({stats.success}/{stats.total})</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                  
                  {entityType !== Object.keys(syncStats.byEntityType).slice(-1)[0] && (
                    <Separator />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
          <CardDescription>Latest sync operations by provider and entity type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncStats.statistics.map((stat, index) => (
              <div key={`${stat.entity_type}-${stat.provider}-${index}`} 
                   className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{capitalizeEntityType(stat.entity_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      Provider: {stat.provider.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {getSuccessRate(stat.success_count, stat.total_count)}% Success
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.last_sync_date 
                        ? `Last: ${format(new Date(stat.last_sync_date), 'MMM dd, HH:mm')}`
                        : 'Never synced'
                      }
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    {getStatusBadge('success', stat.success_count)}
                    {getStatusBadge('error', stat.error_count)}
                    {getStatusBadge('pending', stat.pending_count)}
                    {getStatusBadge('processing', stat.processing_count)}
                  </div>
                </div>
              </div>
            ))}
            
            {syncStats.statistics.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sync activity recorded yet</p>
                <p className="text-sm">Sync operations will appear here once they start</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
