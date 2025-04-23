
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';

export function useProject(projectId?: string) {
  const [project, setProject] = useState<DbProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    async function fetchProject() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (e) {
        console.error('Error fetching project:', e);
        setError(e instanceof Error ? e : new Error('Failed to fetch project'));
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}
