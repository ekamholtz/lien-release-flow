
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Loader2 } from 'lucide-react';

interface ProjectManagerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface ProjectManager {
  id: string;
  first_name?: string;
  last_name?: string;
  invited_email: string;
}

export function ProjectManagerSelector({ value, onChange, disabled = false }: ProjectManagerSelectorProps) {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);

  // Fetch project managers from the company members
  useEffect(() => {
    const fetchProjectManagers = async () => {
      if (!currentCompany?.id) return;
      
      setLoading(true);
      
      try {
        // Use the company_members view which should have all the required fields
        const { data, error } = await supabase
          .from('company_members')
          .select('id, user_id, first_name, last_name, invited_email')
          .eq('company_id', currentCompany.id)
          .eq('status', 'active')
          .in('role', ['company_owner', 'project_manager']);
          
        if (error) {
          console.error('Error fetching project managers:', error);
          throw error;
        }
        
        if (!data) {
          setProjectManagers([]);
          return;
        }
        
        // Format the data - make sure we're handling the types correctly
        const managers: ProjectManager[] = data.map(member => ({
          id: member.user_id,
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          invited_email: member.invited_email
        }));
        
        setProjectManagers(managers);
      } catch (error) {
        console.error('Error fetching project managers:', error);
        setProjectManagers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectManagers();
  }, [currentCompany?.id]);

  // Format display name
  const getDisplayName = (manager: ProjectManager) => {
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.invited_email;
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading..." : "Select project manager"} />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="flex justify-center p-2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            {projectManagers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {getDisplayName(manager)}
              </SelectItem>
            ))}
            {projectManagers.length === 0 && (
              <SelectItem value="no-managers" disabled>
                No project managers available
              </SelectItem>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
