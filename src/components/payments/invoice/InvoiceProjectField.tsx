
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { ProjectSelectWithCreate } from "../../projects/ProjectSelectWithCreate";

interface InvoiceProjectFieldProps {
  control: Control<any>;
}

export function InvoiceProjectField({ control }: InvoiceProjectFieldProps) {
  return (
    <FormField
      control={control}
      name="project"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project</FormLabel>
          <ProjectSelectWithCreate 
            value={field.value} 
            onChange={field.onChange}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
