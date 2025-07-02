
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export type OpenProject = {
  id: string;
  name: string;
  status: string;
};

export function useOpenProjects() {
  const [projects, setProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentCompany } = useCompany();

  const fetchOpenProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentCompany?.id) {
        setProjects([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('company_id', currentCompany.id)
        .in('status', ['active', 'in_progress', 'draft'])
        .order('name');
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading open projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchOpenProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [currentCompany?.id]);

  return {
    projects,
    loading,
    error,
    refetch: fetchOpenProjects
  };
}
