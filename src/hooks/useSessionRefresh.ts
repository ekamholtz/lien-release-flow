
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export const useSessionRefresh = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async (): Promise<Session | null> => {
    try {
      console.log('Attempting to refresh session...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('No current session found');
        setSession(null);
        return null;
      }
      
      console.log('Current session found, checking expiration...');
      
      // If session is close to expiring (within 5 minutes), refresh it
      const expiresAt = (currentSession?.expires_at || 0) * 1000; // Convert to milliseconds
      const fiveMinutes = 5 * 60 * 1000;
      const now = Date.now();
      
      console.log('Session expires at:', new Date(expiresAt).toISOString());
      console.log('Current time:', new Date(now).toISOString());
      console.log('Time until expiration (minutes):', (expiresAt - now) / (1000 * 60));
      
      if (expiresAt - now < fiveMinutes) {
        console.log('Session expires soon, refreshing...');
        
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh error:', error);
          setSession(null);
          return null;
        }
        
        if (newSession) {
          console.log('Session refreshed successfully');
          setSession(newSession);
          return newSession;
        } else {
          console.warn('Session refresh returned no session');
          setSession(null);
          return null;
        }
      }
      
      console.log('Session is still valid, no refresh needed');
      setSession(currentSession);
      return currentSession;
    } catch (error) {
      console.error('Error in refreshSession:', error);
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Setting up session refresh on mount');
    refreshSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
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
