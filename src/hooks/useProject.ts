
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';
import { useCompany } from '@/contexts/CompanyContext';

export function useProject(projectId?: string | null) {
  const [project, setProject] = useState<DbProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (!projectId || !currentCompany?.id) {
      setLoading(false);
      return;
    }

    async function fetchProject() {
      try {
        console.log(`Fetching project with ID: ${projectId} for company: ${currentCompany.id}`);
        
        // Use maybeSingle instead of single to handle cases where the project might not exist
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('company_id', currentCompany.id)
          .maybeSingle();

        if (error) {
          console.error('Error in Supabase query:', error);
          throw error;
        }

        if (!data) {
          console.log(`No project found with ID: ${projectId}`);
          setProject(null);
        } else {
          setProject(data as DbProject);
          console.log("Project data loaded:", data);
        }
      } catch (e) {
        console.error('Error fetching project:', e);
        setError(e instanceof Error ? e : new Error('Failed to fetch project'));
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId, currentCompany?.id]);

  return { project, loading, error };
}
