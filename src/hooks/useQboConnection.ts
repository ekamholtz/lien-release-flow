import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";

export type QboConnectionStatus = "connected" | "needs_reauth" | "not_connected" | "loading";

export function useQboConnection() {
  const [qboStatus, setQboStatus] = useState<QboConnectionStatus>("loading");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { session, refreshSession } = useSessionRefresh();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    console.log("QBO callback params:", { connected, error, message });

    if (connected === "qbo") {
      console.log("QBO connection successful");
      setQboStatus("connected");
      toast.success("Successfully connected to QuickBooks Online");
      navigate("/settings", { replace: true });
    } else if (error === "qbo") {
      console.error("QBO connection error:", message);
      setError(message || "Failed to connect to QuickBooks");
      toast.error(message || "Failed to connect to QuickBooks Online");
      navigate("/settings", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!session?.user) return;
    checkQboConnection();
  }, [session]);

  const checkQboConnection = async () => {
    if (!session?.user) return;
    
    try {
      setError(null);
      setDebugInfo(null);
      
      const response = await supabase
        .from('qbo_connections')
        .select('id,expires_at,refresh_token')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (response.error) {
        console.error("Failed to check QBO connection:", response.error.message);
        throw new Error(`Failed to check QBO connection: ${response.error.message}`);
      }

      const connectionData = response.data;
      
      if (connectionData) {
        if (!connectionData.refresh_token) {
          console.error("Missing refresh token in QBO connection");
          setQboStatus("needs_reauth");
          return;
        }
        
        const expiresAt = new Date(connectionData.expires_at);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        if (isNaN(expiresAt.getTime())) {
          console.error("Invalid expires_at date in QBO connection");
          setQboStatus("needs_reauth");
        } else {
          setQboStatus(expiresAt > fiveMinutesFromNow ? "connected" : "needs_reauth");
        }
      } else {
        setQboStatus("not_connected");
      }
      
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
      console.log("Starting QBO connection process");
      await refreshSession();
      
      const sessionResult = await supabase.auth.getSession();
      const currentSession = sessionResult.data.session;
      
      if (!currentSession?.access_token) {
        throw new Error("No active session found. Please sign in again.");
      }

      const bearer = `Bearer ${currentSession.access_token}`;
      const functionUrl = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize";
      
      console.log("Calling QBO authorize function");
      
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
          console.error("Failed to parse error response:", e);
        }
        
        throw new Error(`Connection failed: ${errorText || response.statusText}`);
      }

      const responseData = await response.json();
      console.log("QBO authorization response received");
      
      if (responseData.debug) {
        setDebugInfo(responseData.debug);
      }
      
      if (!responseData.intuit_oauth_url) {
        throw new Error("No OAuth URL received from server");
      }

      console.log("Redirecting to Intuit OAuth URL");
      window.location.href = responseData.intuit_oauth_url;

    } catch (error: any) {
      console.error("QBO connection error:", error);
      setConnecting(false);
      setError(error.message || String(error));
      
      toast.error(error.message || "Failed to connect to QuickBooks Online");
      throw error;
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
      toast.success('Successfully disconnected from QuickBooks');
    } catch (err: any) {
      console.error('Error disconnecting from QBO:', err);
      toast.error('Failed to disconnect from QuickBooks');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    qboStatus,
    connecting,
    error,
    setError,
    debugInfo,
    isDisconnecting,
    handleConnectQbo,
    handleDisconnectQbo,
    checkQboConnection
  };
}
