
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Control } from 'react-hook-form';
import { ProjectSelector } from '../ProjectSelector';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceProjectFieldProps {
  control: Control<any>;
}

export function InvoiceProjectField({ control }: InvoiceProjectFieldProps) {
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
                    if (!error && data && data.project_manager_id) {
                      // Use field.form from react-hook-form to access setValue
                      if (field.form) {
                        field.form.setValue('project_manager_id', data.project_manager_id);
                      } else {
                        console.log('Form not available, cannot set project_manager_id');
                      }
                    } else {
                      // If no project manager or error, use current user
                      if (field.form) {
                        field.form.setValue('project_manager_id', user?.id);
                      } else {
                        console.log('Form not available, cannot set project_manager_id to user');
                      }
                      console.log('Using current user as project manager, error or no data:', error);
                    }
                  });
              }
            }} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
