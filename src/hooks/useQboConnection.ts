
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
    connectionStatus,
    isLoading,
    error,
    setError,
    debugInfo,
    setDebugInfo,
    checkQboConnection
  } = useQboConnectionStatus(currentCompany?.id);

  const handleConnectQbo = async () => {
    if (!user || !currentCompany?.id) {
      const errorMsg = "Please ensure you're signed in and have selected a company";
      setError(errorMsg);
      toast({
        title: "Authentication Required",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      
      console.log('=== QBO Connection Process Started ===');
      console.log('User ID:', user.id);
      console.log('Company ID:', currentCompany.id);
      
      // Get fresh session with enhanced validation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session retrieval error:', sessionError);
        throw new Error(`Failed to retrieve session: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('No active session found. Please refresh the page and sign in again.');
      }
      
      if (!session.access_token) {
        console.error('No access token in session');
        throw new Error('No access token found. Please refresh the page and sign in again.');
      }
      
      // Enhanced session validation with detailed logging
      const now = Date.now();
      const expiresAt = (session.expires_at || 0) * 1000;
      const timeUntilExpiry = expiresAt - now;
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);
      
      console.log('Session validation:', {
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token.length,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
        minutesUntilExpiry: minutesUntilExpiry.toFixed(2),
        isExpired: timeUntilExpiry <= 0,
        needsRefresh: timeUntilExpiry < 5 * 60 * 1000,
        userId: session.user?.id
      });
      
      // Check if token is expired or about to expire
      if (timeUntilExpiry <= 0) {
        console.error('Token is already expired');
        throw new Error('Your session has expired. Please refresh the page and sign in again.');
      }
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
        console.log('Token expires soon, attempting refresh...');
        
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Session expired and refresh failed. Please refresh the page and sign in again.');
        }
        
        console.log('Token refreshed successfully');
        // Use the refreshed session
        session.access_token = refreshedSession.access_token;
      }
      
      console.log('Session validation successful, initiating QBO auth');
      const response = await initiateQboAuth(session.access_token, currentCompany.id);
      
      if (response.intuit_oauth_url) {
        console.log('QBO OAuth URL received, redirecting...');
        window.location.href = response.intuit_oauth_url;
      } else {
        throw new Error('No OAuth URL received from server');
      }
      
      if (response.debug) {
        console.log('QBO Auth debug info:', response.debug);
        setDebugInfo(response.debug);
      }
      
    } catch (error: any) {
      console.error('=== QBO Connection Error ===', error);
      
      let userMessage = "Failed to connect to QuickBooks Online. Please try again.";
      
      if (error.message?.includes("Session expired") || error.message?.includes("No active session")) {
        userMessage = "Your session has expired. Please refresh the page and sign in again.";
      } else if (error.message?.includes("authorization") || error.message?.includes("token")) {
        userMessage = "Authentication failed. Please refresh the page and try again.";
      } else if (error.message?.includes("Missing authorization header")) {
        userMessage = "Authentication error. Please refresh the page and try signing in again.";
      }
      
      setError(error.message || userMessage);
      toast({
        title: "Connection Failed",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
      console.log('=== QBO Connection Process Ended ===');
    }
  };

  const handleDisconnectQbo = async () => {
    if (!user) {
      setError("Please sign in to disconnect QuickBooks");
      return;
    }

    try {
      setIsDisconnecting(true);
      console.log("Disconnecting QBO for user:", user.id);
      
      const { error: deleteError } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error("Error disconnecting QBO:", deleteError);
        throw deleteError;
      }

      console.log("QBO connection deleted successfully");
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
    connectionStatus,
    connecting,
    isDisconnecting,
    error,
    setError,
    debugInfo,
    handleConnectQbo,
    handleDisconnectQbo
  };
}
