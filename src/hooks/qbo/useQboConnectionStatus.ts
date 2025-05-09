
// The error is related to an excessively deep type instantiation
// Let's fix this by simplifying the type structure or adding type assertions where needed
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ConnectionStatus = 
  | 'loading'
  | 'connected'
  | 'not_connected'
  | 'error';

interface QboConnection {
  id: string;
  user_id: string;
  realm_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const useQboConnectionStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [connection, setConnection] = useState<QboConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStatus('not_connected');
      return;
    }

    const fetchConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('qbo_connections')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setStatus('not_connected');
          } else {
            console.error('Error checking QBO connection:', error);
            setStatus('error');
            setError(error.message);
          }
          return;
        }

        // Use type assertion to avoid excessive type instantiation
        setConnection(data as QboConnection);
        setStatus('connected');
      } catch (err: any) {
        console.error('Failed to fetch QBO connection status:', err);
        setStatus('error');
        setError(err?.message || 'Unknown error');
      }
    };

    fetchConnection();
  }, [user]);

  return { status, connection, error };
};
