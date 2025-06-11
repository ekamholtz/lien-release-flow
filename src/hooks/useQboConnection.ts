
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQboConnectionStatus } from '@/hooks/qbo/useQboConnectionStatus';
import { useCompany } from '@/contexts/CompanyContext';
import { initiateQboAuth } from '@/utils/qbo/qboApi';
import { useAuth } from '@/hooks/useAuth';

export function useQboConnection() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const {
    status: qboStatus,
    error,
    setError,
    debugInfo,
    setDebugInfo,
    checkQboConnection
  } = useQboConnectionStatus(currentCompany?.id);

  const handleConnectQbo = async () => {
    if (!user || !currentCompany?.id) {
      setError("Please ensure you're signed in and have selected a company");
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      
      console.log("Starting QBO connection process");
      
      // Get user session for access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No valid session found");
      }
      
      const response = await initiateQboAuth(session.access_token, currentCompany.id);
      
      if (response.intuit_oauth_url) {
        console.log("Redirecting to Intuit OAuth");
        window.location.href = response.intuit_oauth_url;
      } else {
        throw new Error("No OAuth URL received from server");
      }
      
      if (response.debug) {
        setDebugInfo(response.debug);
      }
    } catch (error: any) {
      console.error('Error connecting to QBO:', error);
      setError(error.message || "Failed to connect to QuickBooks Online");
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to QuickBooks Online. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectQbo = async () => {
    if (!user) {
      setError("Please sign in to disconnect QuickBooks");
      return;
    }

    try {
      setIsDisconnecting(true);
      
      const { error: deleteError } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: "Disconnected",
        description: "QuickBooks Online connection has been removed.",
      });

      // Refresh the connection status
      await checkQboConnection(currentCompany?.id);
    } catch (error: any) {
      console.error('Error disconnecting QBO:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from QuickBooks Online. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    qboStatus,
    connecting,
    isDisconnecting,
    error,
    setError,
    debugInfo,
    handleConnectQbo,
    handleDisconnectQbo
  };
}
