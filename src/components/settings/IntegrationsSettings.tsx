
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

/**
 * Minimal UI for QBO connection status and connect button
 */
export function IntegrationsSettings() {
  const { user } = useAuth();
  const [qboStatus, setQboStatus] = useState<"connected" | "not_connected" | "loading">("loading");

  useEffect(() => {
    if (!user) return;
    setQboStatus("loading");
    fetch(`/rest/v1/qbo_connections?user_id=eq.${user.id}&select=id`, {
      headers: { apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "" }
    })
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => {
        setQboStatus(Array.isArray(rows) && rows.length > 0 ? "connected" : "not_connected");
      })
      .catch(() => setQboStatus("not_connected"));
  }, [user]);

  const handleConnectQbo = () => {
    window.location.href = "/functions/v1/qbo-authorize";
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
          <Button onClick={handleConnectQbo} disabled={qboStatus === "loading"}>
            Connect QuickBooks
          </Button>
        )}
      </div>
    </div>
  )
}

