
import React from 'react';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle2, Clock, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface QboSyncStatusProps {
  syncStatus?: {
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: { message?: string; type?: string } | null;
    error_message?: string | null;
    last_synced_at?: string | null;
    retries?: number;
  } | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  small?: boolean;
}

export const QboSyncStatus = ({ 
  syncStatus, 
  onRetry, 
  isRetrying = false,
  small = false
}: QboSyncStatusProps) => {
  if (!syncStatus) {
    return (
      <Badge variant="outline">
        Not synced
      </Badge>
    );
  }
  
  // Get error type and message
  const errorType = syncStatus.error?.type || 
    (syncStatus.error_message?.includes('token') || syncStatus.error_message?.includes('auth') 
      ? 'token-expired' 
      : syncStatus.error_message?.includes('customer') 
        ? 'customer-error'
        : 'unknown');
  
  const errorMessage = syncStatus.error?.message || syncStatus.error_message;

  // Only show alert for medium/large display
  if (syncStatus.status === 'error' && !small) {
    return (
      <Alert variant="destructive" className="mt-2 mb-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {errorType === 'token-expired' 
            ? 'QuickBooks Authorization Expired' 
            : errorType === 'customer-error'
              ? 'Customer Error'
              : errorType === 'connectivity'
                ? 'QuickBooks Connectivity Issue'
                : 'Sync Failed'}
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{errorMessage || 'An error occurred during QuickBooks sync.'}</p>
          {errorType === 'token-expired' ? (
            <p>Please reconnect your QuickBooks account in Settings.</p>
          ) : (
            onRetry && (
              <Button 
                size="sm" 
                onClick={onRetry} 
                disabled={isRetrying} 
                className="self-start"
              >
                {isRetrying ? 'Retrying...' : 'Retry Sync'}
                {!isRetrying && <RefreshCcw className="ml-2 h-4 w-4" />}
              </Button>
            )
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // For small display or non-error states
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <Badge variant={
              syncStatus.status === 'success' ? 'success' :
              syncStatus.status === 'error' ? 'destructive' :
              syncStatus.status === 'processing' ? 'default' : 
              'outline'
            }>
              {syncStatus.status === 'success' && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {syncStatus.status === 'error' && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {syncStatus.status === 'processing' && (
                <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
              )}
              {syncStatus.status === 'pending' && (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {syncStatus.status === 'success' ? 'Synced' :
               syncStatus.status === 'error' ? 'Failed' :
               syncStatus.status === 'processing' ? 'Syncing' :
               'Pending'}
            </Badge>
            
            {syncStatus.status === 'error' && small && onRetry && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onRetry} 
                disabled={isRetrying} 
                className="h-6 w-6 ml-1"
              >
                <RefreshCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {syncStatus.status === 'success' && (
            <>Synced to QuickBooks{syncStatus.last_synced_at && ` on ${new Date(syncStatus.last_synced_at).toLocaleDateString()}`}</>
          )}
          {syncStatus.status === 'error' && (
            <>
              {errorType === 'token-expired' 
                ? 'QuickBooks authorization expired. Please reconnect in Settings.' 
                : errorType === 'customer-error'
                  ? 'Customer error: Check company name and try again.'
                  : errorType === 'connectivity'
                    ? 'QuickBooks connectivity issue. Please try again later.'
                    : errorMessage || 'Sync failed. Click to retry.'}
            </>
          )}
          {syncStatus.status === 'processing' && (
            <>Syncing to QuickBooks...</>
          )}
          {syncStatus.status === 'pending' && (
            <>Waiting to sync to QuickBooks</>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
