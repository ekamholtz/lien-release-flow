
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

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

  const handleConnectQbo = () => {
    setConnecting(true);
    // Redirect to edge function via GET, which will redirect onward to QBO OAuth
    window.location.href = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize";
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
          <Button onClick={handleConnectQbo} disabled={qboStatus === "loading" || connecting}>
            {connecting ? "Connecting..." : "Connect QuickBooks"}
          </Button>
        )}
      </div>
    </div>
  );
}
