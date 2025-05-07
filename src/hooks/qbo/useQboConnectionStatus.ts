
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';

export type QboStatus = 'connected' | 'disconnected' | 'expired' | 'loading' | 'needs_reauth';

export function useQboConnectionStatus(companyId?: string) {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [status, setStatus] = useState<QboStatus>('loading');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkQboConnection = async (companyIdToCheck: string) => {
    if (!user || !companyIdToCheck) {
      setStatus('disconnected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('qbo_connections')
        .select('expires_at, realm_id')
        .eq('company_id', companyIdToCheck)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setStatus('disconnected');
        setDebugInfo({ message: "No QBO connection found", timestamp: new Date().toISOString() });
        return;
      }

      const expiry = new Date(data.expires_at);
      setExpiresAt(expiry);

      if (expiry < new Date()) {
        setStatus('expired');
        setDebugInfo({ 
          message: "QBO token expired", 
          expiryDate: expiry.toISOString(),
          currentDate: new Date().toISOString() 
        });
      } else {
        setStatus('connected');
        setDebugInfo({ 
          message: "QBO connection active",
          realmId: data.realm_id,
          expiryDate: expiry.toISOString() 
        });
      }
    } catch (err: any) {
      console.error('Error checking QBO status:', err);
      setError(err?.message || 'Failed to check QBO status');
      setStatus('disconnected');
      setDebugInfo({ error: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (companyId || currentCompany?.id)) {
      const effectiveCompanyId = companyId || currentCompany?.id;
      if (effectiveCompanyId) {
        checkQboConnection(effectiveCompanyId);
      }
    }
  }, [user, companyId, currentCompany?.id]);

  // Fixed version that avoids circular dependencies
  const getConnectionUrl = () => {
    const baseUrl = window.location.origin;
    const redirectUrl = `${baseUrl}/settings`;
    
    // Using encodeURIComponent to properly encode the URL
    const encodedRedirectUrl = encodeURIComponent(redirectUrl);
    
    return `/api/qbo/authorize?redirectUrl=${encodedRedirectUrl}`;
  };

  // Create a non-recursive check function to avoid TypeScript's infinite type error
  const refreshConnectionStatus = () => {
    if (companyId) {
      checkQboConnection(companyId);
    } else if (currentCompany?.id) {
      checkQboConnection(currentCompany.id);
    }
  };

  return {
    status,
    expiresAt,
    loading,
    error,
    debugInfo,
    setError,
    setDebugInfo,
    checkQboConnection,
    refreshConnectionStatus,
    getConnectionUrl,
  };
}
