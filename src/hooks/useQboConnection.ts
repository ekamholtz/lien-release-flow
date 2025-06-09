
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useQboConnection() {
  const [connecting, setConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnectQbo = async () => {
    try {
      setConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('qbo-authorize');

      if (error) {
        throw error;
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to QBO:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to QuickBooks Online. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectQbo = async () => {
    try {
      setIsDisconnecting(true);
      
      const { error } = await supabase
        .from('qbo_connections')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Disconnected",
        description: "QuickBooks Online connection has been removed.",
      });
    } catch (error) {
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
    connecting,
    isDisconnecting,
    handleConnectQbo,
    handleDisconnectQbo
  };
}
