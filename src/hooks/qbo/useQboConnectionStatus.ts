
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';

export type QboStatus = 'connected' | 'disconnected' | 'expired' | 'loading';

export function useQboConnectionStatus() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [status, setStatus] = useState<QboStatus>('loading');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setStatus('disconnected');
      setLoading(false);
      return;
    }

    async function checkQboStatus() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('qbo_connections')
          .select('expires_at, realm_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setStatus('disconnected');
          return;
        }

        const expiry = new Date(data.expires_at);
        setExpiresAt(expiry);

        if (expiry < new Date()) {
          setStatus('expired');
        } else {
          setStatus('connected');
        }
      } catch (err) {
        console.error('Error checking QBO status:', err);
        setError(err instanceof Error ? err : new Error('Failed to check QBO status'));
        setStatus('disconnected');
      } finally {
        setLoading(false);
      }
    }

    checkQboStatus();
    // Fixed: removing the status dependency to prevent infinite loop
  }, [user]);

  const getConnectionUrl = () => {
    const baseUrl = window.location.origin;
    const redirectUrl = `${baseUrl}/settings`;
    
    // Using encodeURIComponent to properly encode the URL
    const encodedRedirectUrl = encodeURIComponent(redirectUrl);
    
    return `/api/qbo/authorize?redirectUrl=${encodedRedirectUrl}`;
  };

  return {
    status,
    expiresAt,
    loading,
    error,
    getConnectionUrl,
  };
}
