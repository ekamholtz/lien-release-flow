
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProjectManagerSelector } from '@/components/projects/ProjectManagerSelector';
import { Control } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';

interface BillProjectManagerFieldProps {
  control: Control<any>;
}

export function BillProjectManagerField({ control }: BillProjectManagerFieldProps) {
  const { user } = useAuth();
  
  return (
    <FormField
      control={control}
      name="project_manager_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project Manager</FormLabel>
          <FormControl>
            <ProjectManagerSelector 
              value={field.value || user?.id || ''} 
              onChange={field.onChange} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
