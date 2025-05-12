
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initiateQboAuth } from "@/utils/qbo/qboApi";

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
      const responseData: QboAuthResponse = await initiateQboAuth(accessToken, companyId);
      
      if (responseData.debug) {
        console.log("QBO debug info:", responseData.debug);
      }
      
      if (!responseData.intuit_oauth_url) {
        throw new Error("No OAuth URL received from server");
      }
      
      console.log("Redirecting to Intuit OAuth URL");
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
