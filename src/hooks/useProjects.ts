
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export type Project = {
  id: string;
  name: string;
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Ensure we have a company ID before fetching
      if (!currentCompany?.id) {
        setProjects([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', currentCompany.id)
        .order('name');
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [currentCompany?.id]);

  return {
    projects,
    loading,
    fetchProjects
  };
}
