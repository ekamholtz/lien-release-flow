import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X } from "lucide-react";
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
  const { session } = useSessionRefresh();
  
  const {
    qboStatus,
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
    if (qboStatus === "loading") {
      toast.info("Checking QuickBooks connection status...");
    }
  }, [qboStatus]);

  const handleQboConnectWithRetry = async () => {
    if (!session?.access_token) {
      toast.error("Please sign in to connect QuickBooks");
      return;
    }
    
    try {
      console.log("Starting QBO connection process");
      await handleConnectQbo();
    } catch (error: any) {
      console.error("QBO connection error:", error);
      toast.error("Failed to connect to QuickBooks. Please try again.");
      
      setError(error?.message || "Connection failed. Please ensure you're signed in and try again.");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">QuickBooks Online</h2>
      <div className="flex items-center gap-4">
        <span>
          Status:{" "}
          {qboStatus === "loading" ? (
            <span className="text-gray-500">Checking…</span>
          ) : qboStatus === "connected" ? (
            <span className="text-green-600 font-medium">Connected</span>
          ) : qboStatus === "needs_reauth" ? (
            <span className="text-amber-600 font-medium">Needs Reauthorization</span>
          ) : qboStatus === "not_connected" ? (
            <span className="text-red-600 font-medium">Not Connected</span>
          ) : (
            <span className="text-red-600 font-medium">Error</span>
          )}
        </span>
        
        {qboStatus === "connected" ? (
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
                Disconnect QuickBooks
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect QuickBooks?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the connection to your QuickBooks account. You'll need to reconnect to sync invoices again. This action cannot be undone.
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
            disabled={qboStatus === "loading" || connecting}
            className="gap-2"
          >
            {connecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : qboStatus === "needs_reauth" ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect QuickBooks
              </>
            ) : (
              "Connect QuickBooks"
            )}
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            {typeof error === 'string' && error.includes("token") && (
              <p className="text-sm">
                This usually means your QuickBooks session has expired. Please try reconnecting.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleQboConnectWithRetry}
            >
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-sm text-amber-700">
          <strong>Note:</strong> Make sure that your Intuit Developer account has these redirect URIs configured:
          <code className="block mt-1 p-2 bg-white rounded border border-amber-100">
            https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback
          </code>
          <code className="block mt-1 p-2 bg-white rounded border border-amber-100">
            https://oknofqytitpxmlprvekn.supabase.co/functions/v1/qbo-callback
          </code>
        </p>
      </div>
      
      {qboStatus === "connected" && (
        <>
          <QboSyncStatus
            syncStats={syncStats}
            isRefreshingStats={isRefreshingStats}
            onRefresh={fetchSyncStats}
            onRetryFailed={handleRetryFailedSyncs}
          />
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Sync to QBO</h3>
            <p className="text-sm text-gray-600">
              All invoices created will automatically sync to QuickBooks Online. 
              You can also manually sync invoices from the invoices table by clicking the "Sync to QBO" button.
            </p>
          </div>
        </>
      )}
      
      <QboDebugInfo debugInfo={debugInfo} />
    </div>
  );
}
