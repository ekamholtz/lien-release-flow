
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
  }, [session]);

  const checkQboConnection = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(
        `https://oknofqytitpxmlprvekn.supabase.co/rest/v1/qbo_connections?user_id=eq.${session.user.id}&select=id,expires_at`,
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
      
      if (Array.isArray(connectionData) && connectionData.length > 0) {
        // Check if token is expired or will expire in next 5 minutes
        const expiresAt = new Date(connectionData[0].expires_at);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        setQboStatus(expiresAt > fiveMinutesFromNow ? "connected" : "needs_reauth");
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
    debugInfo,
    isDisconnecting,
    handleConnectQbo,
    handleDisconnectQbo
  };
}
