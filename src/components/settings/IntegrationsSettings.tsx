
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { supabase } from "@/integrations/supabase/client";

export function IntegrationsSettings() {
  const [qboStatus, setQboStatus] = useState<"connected" | "not_connected" | "loading">("loading");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, refreshSession } = useSessionRefresh();

  useEffect(() => {
    if (!session?.user) return;
    checkQboConnection();
  }, [session]);

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
    } catch (err) {
      console.error("Error checking QBO connection:", err);
      setQboStatus("not_connected");
      setError("Failed to check QuickBooks connection status");
    }
  };

  const handleConnectQbo = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Force a complete session refresh to get a fresh token
      await supabase.auth.refreshSession();
      const sessionResult = await supabase.auth.getSession();
      const currentSession = sessionResult.data.session;
      
      if (!currentSession?.access_token) {
        throw new Error("No active session found. Please sign in again.");
      }

      const bearer = `Bearer ${currentSession.access_token}`;
      console.log("Auth header (first 30 chars):", bearer.slice(0, 30));

      const response = await fetch(
        "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize",
        {
          method: "GET",
          headers: {
            Authorization: bearer,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
            "Content-Type": "application/json"
          },
          mode: "cors"
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("QBO authorize error details:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        throw new Error(`Connection failed: ${errorText || response.statusText}`);
      }

      const responseData = await response.json();
      
      if (!responseData.intuit_oauth_url) {
        throw new Error("No OAuth URL received from server");
      }

      window.location.href = responseData.intuit_oauth_url;

    } catch (error: any) {
      console.error("QBO connection error:", error);
      setConnecting(false);
      setError(error.message || String(error));
      
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to QuickBooks Online",
        variant: "destructive"
      });
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
      
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-sm text-amber-700">
          <strong>Note:</strong> Make sure that <code>QBO_REDIRECT_URI</code> (https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback) 
          is properly set in both your Supabase Edge Function environment and in your Intuit Developer account.
        </p>
      </div>
    </div>
  );
}
