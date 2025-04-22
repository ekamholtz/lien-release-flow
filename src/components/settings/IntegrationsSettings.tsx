
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";

/**
 * Minimal UI for QBO connection status and connect button
 */
export function IntegrationsSettings() {
  const { user, session } = useAuth();
  const [qboStatus, setQboStatus] = useState<"connected" | "not_connected" | "loading">("loading");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleConnectQbo = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in before connecting QuickBooks Online.",
        variant: "destructive"
      });
      return;
    }
    setConnecting(true);
    setError(null);

    try {
      console.log("Initiating QBO connection...");
      // 1. Call qbo-authorize with Authorization header
      const response = await fetch(
        "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize",
        {
          method: "POST", // Use POST to avoid browser cache issues and allow CORS
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("QBO authorize response status:", response.status);
      
      const responseText = await response.text();
      console.log("QBO authorize response:", responseText);
      
      if (!response.ok) {
        throw new Error(responseText || "Failed to connect to QuickBooks Online");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid response from server");
      }

      if (data?.intuit_oauth_url) {
        console.log("Redirecting to Intuit OAuth URL...");
        // 2. Redirect user to Intuit OAuth
        window.location.href = data.intuit_oauth_url;
      } else {
        console.error("Missing OAuth URL in response:", data);
        throw new Error("Unexpected response. Could not start QuickBooks Online connection.");
      }
    } catch (error: any) {
      console.error("QBO connect error:", error);
      
      // Try to extract error message from JSON if possible
      let errorMessage = "Could not connect to QuickBooks Online. Please try again.";
      
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      setError(errorMessage);
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
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
