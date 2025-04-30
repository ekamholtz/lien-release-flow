
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectType } from '@/types/project';

export function useProjectTypeLookup(projectTypeId?: string) {
  const { data: projectType } = useQuery({
    queryKey: ['project-type', projectTypeId],
    queryFn: async () => {
      if (!projectTypeId) return null;
      
      const { data, error } = await supabase
        .from('project_types')
        .select('*')
        .eq('id', projectTypeId)
        .single();
        
      if (error) throw error;
      
      return data as ProjectType;
    },
    enabled: !!projectTypeId
  });

  return { projectType };
}
