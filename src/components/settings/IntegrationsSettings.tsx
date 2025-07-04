
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQboConnection } from "@/hooks/useQboConnection";
import { useQboSyncStats } from "@/hooks/useQboSyncStats";
import { QboDebugInfo } from "./QboDebugInfo";
import { QboSyncStatus } from "./QboSyncStatus";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";

export function IntegrationsSettings() {
  const { session, refreshSession } = useSessionRefresh();
  
  const {
    connectionStatus,
    connecting,
    error,
    setError,
    debugInfo,
    isDisconnecting,
    handleConnectQbo,
    handleDisconnectQbo
  } = useQboConnection();

  const {
    syncStats,
    isRefreshingStats,
    fetchSyncStats,
    handleRetryFailedSyncs
  } = useQboSyncStats();

  React.useEffect(() => {
    if (connectionStatus.status === "loading") {
      console.log("Checking QuickBooks connection status...");
    }
  }, [connectionStatus.status]);

  const handleQboConnectWithRetry = async () => {
    console.log("Handle QBO connect called");
    console.log("Session state:", {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      userId: session?.user?.id
    });
    
    if (!session?.access_token) {
      console.error("No session or access token available");
      toast.error("Please sign in to connect QuickBooks");
      
      // Try to refresh session first
      console.log("Attempting to refresh session...");
      const refreshedSession = await refreshSession();
      
      if (!refreshedSession?.access_token) {
        setError("Session expired. Please refresh the page and sign in again.");
        return;
      }
      
      console.log("Session refreshed, retrying connection...");
    }
    
    try {
      console.log("Starting QBO connection process");
      await handleConnectQbo();
    } catch (error: any) {
      console.error("QBO connection error:", error);
      toast.error("Failed to connect to QuickBooks. Please try again.");
      
      if (error?.message?.includes("authorization") || error?.message?.includes("token")) {
        setError("Authentication error. Please refresh the page and try again.");
      } else {
        setError(error?.message || "Connection failed. Please ensure you're signed in and try again.");
      }
    }
  };

  const getStatusDisplay = () => {
    switch (connectionStatus.status) {
      case "loading":
        return (
          <span className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking connection...
          </span>
        );
      case "connected":
        return (
          <span className="text-green-600 font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Connected
          </span>
        );
      case "needs_reauth":
        return (
          <span className="text-amber-600 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Needs Reauthorization
          </span>
        );
      case "not_connected":
        return (
          <span className="text-red-600 font-medium">Not Connected</span>
        );
      case "error":
      default:
        return (
          <span className="text-red-600 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Connection Error
          </span>
        );
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">QuickBooks Online Integration</h2>
      
      {/* Connection Status Section */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Connection Status</h3>
            <div className="mt-2">
              {getStatusDisplay()}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {connectionStatus.status === "connected" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDisconnecting}
                    className="gap-2"
                  >
                    {isDisconnecting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect QuickBooks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the connection to your QuickBooks account. You'll need to reconnect to sync data again. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisconnectQbo}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={handleQboConnectWithRetry}
                disabled={connectionStatus.status === "loading" || connecting}
                className="gap-2"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : connectionStatus.status === "needs_reauth" ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Reconnect QuickBooks
                  </>
                ) : (
                  "Connect QuickBooks"
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Connection Details */}
        {connectionStatus.connection && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Realm ID:</strong> {connectionStatus.connection.realm_id}</p>
            <p><strong>Connected:</strong> {new Date(connectionStatus.connection.created_at).toLocaleDateString()}</p>
            <p><strong>Expires:</strong> {new Date(connectionStatus.connection.expires_at).toLocaleDateString()}</p>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{String(error)}</p>
            {typeof error === 'string' && error.includes("token") && (
              <p className="text-sm">
                This usually means your session has expired. Please refresh the page and try again.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQboConnectWithRetry}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  "Retry Connection"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Setup Instructions */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-2">Setup Requirements</p>
            <p className="mb-2">
              Make sure your Intuit Developer account has these redirect URIs configured:
            </p>
            <div className="space-y-1 font-mono text-xs">
              <code className="block p-2 bg-white rounded border border-amber-100">
                https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback
              </code>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sync Statistics */}
      {connectionStatus.status === "connected" && (
        <>
          <QboSyncStatus
            syncStats={syncStats}
            isRefreshingStats={isRefreshingStats}
            onRefresh={fetchSyncStats}
            onRetryFailed={handleRetryFailedSyncs}
          />
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Automatic Sync</h3>
            <p className="text-sm text-gray-600">
              All invoices, bills, and payments are automatically synced to QuickBooks Online. 
              You can also manually sync individual items using the "Sync to QBO" buttons throughout the application.
            </p>
          </div>
        </>
      )}
      
      {/* Debug Information */}
      {debugInfo && <QboDebugInfo debugInfo={debugInfo} />}
    </div>
  );
}
