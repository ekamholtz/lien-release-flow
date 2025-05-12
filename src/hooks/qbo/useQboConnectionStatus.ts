
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

export const useQboConnectionStatus = (companyId?: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<QboStatus>('loading');
  const [connection, setConnection] = useState<QboConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkQboConnection = async (cId?: string) => {
    if (!user || !cId) {
      setStatus('not_connected');
      return;
    }

    try {
      // Query qbo_connections table for this user/company
      const { data, error: queryError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setStatus('not_connected');
        } else {
          console.error('Error checking QBO connection:', queryError);
          setStatus('error');
          setError(queryError.message);
        }
        return;
      }

      setConnection(data as QboConnection);
      
      // Check if token is expired or about to expire
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const timeDiff = expiresAt.getTime() - now.getTime();
      
      // If token expires in less than 10 minutes, treat it as needs reauth
      if (timeDiff < 600000) {
        setStatus('needs_reauth');
      } else {
        setStatus('connected');
      }
    } catch (err: any) {
      console.error('Failed to fetch QBO connection status:', err);
      setStatus('error');
      setError(err?.message || 'Unknown error');
    }
  };

  useEffect(() => {
    checkQboConnection(companyId);
  }, [user, companyId]);

  return { 
    status, 
    connection, 
    error, 
    setError,
    debugInfo,
    setDebugInfo,
    checkQboConnection
  };
};
