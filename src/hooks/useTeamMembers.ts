
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type DbTeamMember } from '@/lib/supabase';

export function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<DbTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error loading team members:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch team members'));
    } finally {
      setLoading(false);
    }
  };

  const updateTeamMemberStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh team members list after update
      fetchTeamMembers();
      
      return { success: true };
    } catch (err) {
      console.error('Error updating team member status:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update status' };
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers,
    loading,
    error,
    fetchTeamMembers,
    updateTeamMemberStatus
  };
}
