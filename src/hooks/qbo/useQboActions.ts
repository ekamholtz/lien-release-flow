
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define explicit interface for the QBO auth response
interface QboAuthResponse {
  intuit_oauth_url?: string;
  debug?: any;
  error?: string;
}

export function useQboActions() {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);

  const handleConnectQbo = async (companyId: string, accessToken: string) => {
    if (!companyId) {
      toast.error("Please select a company to connect QuickBooks");
      return;
    }
    
    setConnecting(true);
    
    try {
      const response = await fetch(
        "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-authorize",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbm9mcXl0aXRweG1scHJ2ZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDk0MzcsImV4cCI6MjA1OTI4NTQzN30.NG0oR4m9GCeLfpr11hsZEG5hVXs4uZzJOcFT7elrIAQ",
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Connection failed: ${errorText || response.statusText}`);
      }
      
      // Parse the response safely with proper error handling
      const responseText = await response.text();
      let responseData: QboAuthResponse = { intuit_oauth_url: '' };
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse QBO response:", parseError);
        throw new Error("Failed to parse QBO response");
      }
      
      if (!responseData.intuit_oauth_url) {
        throw new Error("No OAuth URL received from server");
      }
      
      // Store the company_id in session storage for retrieval after OAuth redirection
      sessionStorage.setItem('qbo_company_id', companyId);
      
      // Redirect to OAuth URL
      window.location.href = responseData.intuit_oauth_url;

    } catch (error: any) {
      console.error("QBO connection error:", error);
      setConnecting(false);
      throw error;
    }
  };

  const handleDisconnectQbo = async (companyId: string) => {
    if (!companyId) return;
    
    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success('Successfully disconnected from QuickBooks');
      return true;
    } catch (err: any) {
      console.error('Error disconnecting from QBO:', err);
      toast.error('Failed to disconnect from QuickBooks');
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    connecting,
    isDisconnecting,
    handleConnectQbo,
    handleDisconnectQbo
  };
}
