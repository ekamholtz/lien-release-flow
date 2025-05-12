
import { useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProjectSelector } from '../ProjectSelector';
import { Control } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BillProjectFieldProps {
  control: Control<any>;
}

export function BillProjectField({ control }: BillProjectFieldProps) {
  const { user } = useAuth();
  
  return (
    <FormField
      control={control}
      name="project"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project</FormLabel>
          <FormControl>
            <ProjectSelector value={field.value} onChange={(value) => {
              field.onChange(value);
              
              // If a project is selected, get the project_manager_id
              if (value && value !== 'create-new') {
                // Update the project manager field
                supabase
                  .from('projects')
                  .select('project_manager_id')
                  .eq('id', value)
                  .single()
                  .then(({ data, error }) => {
                    if (!error && data) {
                      // Update the project_manager_id in the form
                      control._formValues.project_manager_id = data.project_manager_id || user?.id;
                    } else {
                      // If no project manager or error, use current user
                      control._formValues.project_manager_id = user?.id;
                      console.log('Using current user as project manager, error or no data:', error);
                    }
                  });
              } else {
                // If no project is selected, use current user as project manager
                control._formValues.project_manager_id = user?.id;
              }
            }} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
