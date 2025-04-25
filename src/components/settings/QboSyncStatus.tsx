
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QboSyncStats } from "@/hooks/useQboSyncStats";

interface QboSyncStatusProps {
  syncStats: QboSyncStats;
  isRefreshingStats: boolean;
  onRefresh: () => void;
  onRetryFailed: () => void;
}

export function QboSyncStatus({ 
  syncStats, 
  isRefreshingStats, 
  onRefresh, 
  onRetryFailed 
}: QboSyncStatusProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">QBO Sync Status</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshingStats}
          >
            {isRefreshingStats ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh Stats
              </>
            )}
          </Button>
          {syncStats.failed > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={onRetryFailed}
            >
              Retry Failed Syncs
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-4 bg-white border rounded-md shadow-sm">
        <dl className="grid grid-cols-4 gap-4 p-4">
          <div>
            <dt className="text-sm text-gray-500">Total Invoices</dt>
            <dd className="mt-1 text-lg font-semibold">{syncStats.total}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Synced</dt>
            <dd className="mt-1 text-lg font-semibold text-green-600">
              {syncStats.synced}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Pending</dt>
            <dd className="mt-1 text-lg font-semibold text-blue-600">
              {syncStats.pending}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Failed</dt>
            <dd className="mt-1 text-lg font-semibold text-red-600">
              {syncStats.failed}
            </dd>
          </div>
        </dl>
        
        {syncStats.total > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Sync Progress</span>
              <span>{Math.round((syncStats.synced / syncStats.total) * 100)}%</span>
            </div>
            <Progress 
              value={(syncStats.synced / syncStats.total) * 100}
              className="h-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
