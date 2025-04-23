
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export const useSessionRefresh = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        return null;
      }
      
      // If session is close to expiring (within 5 minutes), refresh it
      const expiresAt = (currentSession?.expires_at || 0) * 1000; // Convert to milliseconds
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresAt - Date.now() < fiveMinutes) {
        const { data: { session: newSession } } = await supabase.auth.refreshSession();
        setSession(newSession);
        return newSession;
      }
      
      setSession(currentSession);
      return currentSession;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return { session, loading, refreshSession };
};
