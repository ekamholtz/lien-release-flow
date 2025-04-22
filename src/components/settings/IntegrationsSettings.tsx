
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

/**
 * Minimal UI for QBO connection status and connect button
 */
export function IntegrationsSettings() {
  const { user, session } = useAuth();
  const [qboStatus, setQboStatus] = useState<"connected" | "not_connected" | "loading">("loading");
  const [connecting, setConnecting] = useState(false);

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
      })
      .catch(() => setQboStatus("not_connected"));
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

    try {
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

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const data = await response.json();
      if (data?.intuit_oauth_url) {
        // 2. Redirect user to Intuit OAuth
        window.location.href = data.intuit_oauth_url;
      } else {
        throw new Error("Unexpected response. Could not start QuickBooks Online connection.");
      }
    } catch (error: any) {
      console.error("QBO connect error", error);
      toast({
        title: "Connection Error",
        description: typeof error === "string" ? error : (error?.message || "Could not connect to QuickBooks Online. Please try again."),
        variant: "destructive"
      });
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
    </div>
  );
}
