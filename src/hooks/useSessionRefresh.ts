
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export const useSessionRefresh = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async (): Promise<Session | null> => {
    try {
      console.log('=== Session Refresh Started ===');
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session retrieval error:', sessionError);
        setSession(null);
        return null;
      }
      
      if (!currentSession) {
        console.log('No current session found');
        setSession(null);
        return null;
      }
      
      console.log('Current session found:', {
        userId: currentSession.user?.id,
        expiresAt: currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'unknown',
        hasAccessToken: !!currentSession.access_token,
        tokenLength: currentSession.access_token?.length || 0
      });
      
      // If session is close to expiring (within 5 minutes), refresh it
      const expiresAt = (currentSession?.expires_at || 0) * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      const now = Date.now();
      
      console.log('Session expiration check:', {
        expiresAt: new Date(expiresAt).toISOString(),
        currentTime: new Date(now).toISOString(),
        minutesUntilExpiration: (expiresAt - now) / (1000 * 60),
        needsRefresh: expiresAt - now < fiveMinutes
      });
      
      if (expiresAt - now < fiveMinutes) {
        console.log('Session expires soon, attempting refresh...');
        
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
          setSession(null);
          return null;
        }
        
        if (newSession) {
          console.log('Session refreshed successfully:', {
            userId: newSession.user?.id,
            newExpiresAt: newSession.expires_at ? new Date(newSession.expires_at * 1000).toISOString() : 'unknown',
            hasNewAccessToken: !!newSession.access_token
          });
          setSession(newSession);
          return newSession;
        } else {
          console.warn('Session refresh returned null session');
          setSession(null);
          return null;
        }
      }
      
      console.log('Session is still valid, no refresh needed');
      setSession(currentSession);
      return currentSession;
    } catch (error) {
      console.error('Unexpected error in refreshSession:', error);
      setSession(null);
      return null;
    } finally {
      setLoading(false);
      console.log('=== Session Refresh Completed ===');
    }
  };

  useEffect(() => {
    console.log('Setting up session refresh on mount');
    refreshSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          hasAccessToken: !!session?.access_token
        });
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up session refresh subscription');
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, refreshSession };
};
