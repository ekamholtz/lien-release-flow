
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

/**
 * Minimal UI for QBO connection status and connect button
 */
export function IntegrationsSettings() {
  const { user, session } = useAuth();
  const [qboStatus, setQboStatus] = useState<"connected" | "not_connected" | "loading">("loading");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setQboStatus("loading");
    fetch(
      `https://oknofqytitpxmlprvekn.supabase.co/rest/v1/qbo_connections?user_id=eq.${user.id}&select=id`,
      {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        }
      }
    )
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => {
        setQboStatus(Array.isArray(rows) && rows.length > 0 ? "connected" : "not_connected");
        setError(null);
      })
      .catch((err) => {
        console.error("Error checking QBO connection:", err);
        setQboStatus("not_connected");
        setError("Failed to check QuickBooks connection status");
      });
  }, [user, session]);

  // Handler: simplified window.location redirect approach
  const handleConnectQbo = async () => {
    setConnecting(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Get a fresh session to ensure token is fresh
      const { data } = await supabase.auth.getSession();
      const sessionToken = data?.session?.access_token;

      if (!sessionToken) {
        setConnecting(false);
        toast({
          title: "Authentication Required",
          description: "Please sign in again before connecting QuickBooks Online.",
          variant: "destructive"
        });
        return;
      }

      // Simple redirect with token as query param
      const edgeUrl = `https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize?token=${encodeURIComponent(sessionToken)}`;
      console.log("Redirecting to:", edgeUrl);
      
      // Direct redirect - the browser will handle the rest
      window.location.href = edgeUrl;
    } catch (error) {
      console.error("Error initiating QBO connection:", error);
      setConnecting(false);
      setError("Failed to initiate QuickBooks connection");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">QuickBooks Online</h2>
      <div className="flex items-center gap-4">
        <span>
          Status:{" "}
          {qboStatus === "loading"
            ? <span className="text-gray-500">Checking…</span>
            : qboStatus === "connected"
              ? <span className="text-green-600 font-medium">Connected</span>
              : <span className="text-red-600 font-medium">Not Connected</span>}
        </span>
        {qboStatus !== "connected" && (
          <Button
            onClick={handleConnectQbo}
            disabled={qboStatus === "loading" || connecting}
          >
            {connecting ? "Connecting..." : "Connect QuickBooks"}
          </Button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {debugInfo && (
        <div className="mt-2 p-2 bg-gray-100 border border-gray-200 rounded text-xs font-mono overflow-auto max-w-full">
          <p>{debugInfo}</p>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-sm text-amber-700">
          <strong>Note:</strong> Make sure that <code>QBO_REDIRECT_URI</code> (https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback) 
          is properly set in both your Supabase Edge Function environment and in your Intuit Developer account.
        </p>
      </div>
    </div>
  );
}
