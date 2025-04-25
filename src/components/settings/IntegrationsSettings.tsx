import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, Info, RefreshCw, X } from "lucide-react";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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

export function IntegrationsSettings() {
  const [qboStatus, setQboStatus] = useState<"connected" | "not_connected" | "loading">("loading");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [syncStats, setSyncStats] = useState<{
    total: number;
    synced: number;
    failed: number;
    pending: number;
  }>({ total: 0, synced: 0, failed: 0, pending: 0 });
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { session, refreshSession } = useSessionRefresh();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (connected === "qbo") {
      setQboStatus("connected");
      toast.success("Successfully connected to QuickBooks Online");
      navigate("/settings", { replace: true });
    } else if (error === "qbo") {
      setError(message || "Failed to connect to QuickBooks");
      toast.error(message || "Failed to connect to QuickBooks Online");
      navigate("/settings", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!session?.user) return;
    checkQboConnection();
    fetchSyncStats();
  }, [session]);

  const fetchSyncStats = async () => {
    if (!session?.user) return;
    
    try {
      setIsRefreshingStats(true);
      const { data: syncRecords, error } = await supabase
        .from('accounting_sync')
        .select('*')
        .eq('entity_type', 'invoice')
        .eq('provider', 'qbo');

      if (error) throw error;

      const stats = {
        total: syncRecords.length,
        synced: syncRecords.filter(rec => rec.status === 'success').length,
        failed: syncRecords.filter(rec => rec.status === 'error').length,
        pending: syncRecords.filter(rec => ['pending', 'processing'].includes(rec.status || '')).length
      };

      setSyncStats(stats);
    } catch (err) {
      console.error('Error fetching sync stats:', err);
      toast.error('Failed to load QBO sync statistics');
    } finally {
      setIsRefreshingStats(false);
    }
  };

  const handleRefreshStats = () => {
    fetchSyncStats();
  };
  
  const handleRetryFailedSyncs = async () => {
    if (!session?.access_token) return;
    
    try {
      toast.info('Retrying failed QBO syncs...');
      
      const response = await fetch(
        'https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-sync-retry',
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
        const error = await response.text();
        throw new Error(`Failed to trigger retry: ${error}`);
      }
      
      const result = await response.json();
      
      if (result.processed > 0) {
        toast.success(`Scheduled retry for ${result.processed} failed syncs`);
      } else {
        toast.info('No failed syncs found to retry');
      }
      
      setTimeout(() => {
        fetchSyncStats();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error retrying syncs:', err);
      toast.error(`Retry error: ${err.message}`);
    }
  };

  const checkQboConnection = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(
        `https://oknofqytitpxmlprvekn.supabase.co/rest/v1/qbo_connections?user_id=eq.${session.user.id}&select=id`,
        {
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
            Authorization: session.access_token ? `Bearer ${session.access_token}` : "",
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check QBO connection: ${response.statusText}`);
      }

      const connectionData = await response.json();
      setQboStatus(Array.isArray(connectionData) && connectionData.length > 0 ? "connected" : "not_connected");
      setError(null);
      setDebugInfo(null);
    } catch (err) {
      console.error("Error checking QBO connection:", err);
      setQboStatus("not_connected");
      setError("Failed to check QuickBooks connection status");
    }
  };

  const handleConnectQbo = async () => {
    setConnecting(true);
    setError(null);
    setDebugInfo(null);

    try {
      await refreshSession();
      
      const sessionResult = await supabase.auth.getSession();
      const currentSession = sessionResult.data.session;
      
      if (!currentSession?.access_token) {
        throw new Error("No active session found. Please sign in again.");
      }

      const bearer = `Bearer ${currentSession.access_token}`;
      const functionUrl = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize";
      
      console.log("Calling function URL:", functionUrl);
      
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          Authorization: bearer,
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
          "Content-Type": "application/json"
        },
        mode: "cors"
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("QBO authorize error details:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        try {
          const errorJson = JSON.parse(errorText);
          setDebugInfo(errorJson.debug || {});
        } catch (e) {
          // If it's not JSON, just use the text
        }
        
        throw new Error(`Connection failed: ${errorText || response.statusText}`);
      }

      const responseData = await response.json();
      console.log("QBO response data:", responseData);
      
      if (responseData.debug) {
        setDebugInfo(responseData.debug);
      }
      
      if (!responseData.intuit_oauth_url) {
        throw new Error("No OAuth URL received from server");
      }

      window.location.href = responseData.intuit_oauth_url;

    } catch (error: any) {
      console.error("QBO connection error:", error);
      setConnecting(false);
      setError(error.message || String(error));
      
      toast.error(error.message || "Failed to connect to QuickBooks Online");
    }
  };

  const handleDisconnectQbo = async () => {
    if (!session?.user) return;
    
    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      setQboStatus('not_connected');
      setSyncStats({ total: 0, synced: 0, failed: 0, pending: 0 });
      toast.success('Successfully disconnected from QuickBooks');
    } catch (err: any) {
      console.error('Error disconnecting from QBO:', err);
      toast.error('Failed to disconnect from QuickBooks');
    } finally {
      setIsDisconnecting(false);
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
          ) : (
            <span className="text-red-600 font-medium">Not Connected</span>
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
            onClick={handleConnectQbo}
            disabled={qboStatus === "loading" || connecting}
          >
            {connecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
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
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleConnectQbo}
          >
            Retry Connection
          </Button>
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
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">QBO Sync Status</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStats}
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
                    onClick={handleRetryFailedSyncs}
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
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Sync to QBO</h3>
            <p className="text-sm text-gray-600">
              All invoices created will automatically sync to QuickBooks Online. 
              You can also manually sync invoices from the invoices table by clicking the "Sync to QBO" button.
            </p>
          </div>
        </>
      )}
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Debug Information</span>
          </div>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
