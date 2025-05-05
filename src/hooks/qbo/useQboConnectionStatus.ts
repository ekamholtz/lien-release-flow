
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type QboConnectionStatus = "connected" | "needs_reauth" | "not_connected" | "loading";

// Define an explicit type for the QBO connection data
interface QboConnection {
  id: string;
  expires_at: string;
  refresh_token: string | null;
}

export function useQboConnectionStatus(companyId?: string) {
  const [qboStatus, setQboStatus] = useState<QboConnectionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Handle OAuth redirect callback
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

  // Check connection status when company ID changes
  useEffect(() => {
    if (companyId) {
      checkQboConnection(companyId);
    }
  }, [companyId]);

  const checkQboConnection = async (currentCompanyId: string) => {
    try {
      setError(null);
      setDebugInfo(null);
      
      // Use Promise-based approach and avoid complex type inference
      const { data, error: queryError } = await supabase
        .from('qbo_connections')
        .select('id,expires_at,refresh_token')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (queryError) {
        console.error("Failed to check QBO connection:", queryError.message);
        throw new Error(`Failed to check QBO connection: ${queryError.message}`);
      }
      
      // Type assertion to help TypeScript understand the structure
      const connectionData = data as QboConnection | null;
      
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

  return {
    qboStatus,
    error,
    setError,
    debugInfo,
    setDebugInfo,
    checkQboConnection
  };
}
