
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type QboStatus = 
  | 'loading'
  | 'connected'
  | 'not_connected'
  | 'needs_reauth'
  | 'error';

interface QboConnection {
  id: string;
  user_id: string;
  realm_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface QboConnectionStatus {
  isConnected: boolean;
  status: QboStatus;
  connection: QboConnection | null;
}

export const useQboConnectionStatus = (companyId?: string) => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<QboConnectionStatus>({
    isConnected: false,
    status: 'loading',
    connection: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkQboConnection = async (cId?: string) => {
    if (!user || !cId) {
      setConnectionStatus({
        isConnected: false,
        status: 'not_connected',
        connection: null
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Query qbo_connections table for this user/company
      const { data, error: queryError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setConnectionStatus({
            isConnected: false,
            status: 'not_connected',
            connection: null
          });
        } else {
          console.error('Error checking QBO connection:', queryError);
          setConnectionStatus({
            isConnected: false,
            status: 'error',
            connection: null
          });
          setError(queryError.message);
        }
        return;
      }

      const connection = data as QboConnection;
      
      // Check if token is expired or about to expire
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      const timeDiff = expiresAt.getTime() - now.getTime();
      
      // If token expires in less than 10 minutes, treat it as needs reauth
      if (timeDiff < 600000) {
        setConnectionStatus({
          isConnected: false,
          status: 'needs_reauth',
          connection
        });
      } else {
        setConnectionStatus({
          isConnected: true,
          status: 'connected',
          connection
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch QBO connection status:', err);
      setConnectionStatus({
        isConnected: false,
        status: 'error',
        connection: null
      });
      setError(err?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkQboConnection(companyId);
  }, [user, companyId]);

  return { 
    connectionStatus,
    isLoading,
    error, 
    setError,
    debugInfo,
    setDebugInfo,
    checkQboConnection
  };
};
