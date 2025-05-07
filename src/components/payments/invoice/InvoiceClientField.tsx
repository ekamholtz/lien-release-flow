
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { ClientSelector } from '../../clients/ClientSelector';

interface InvoiceClientFieldProps {
  control: Control<any>;
}

export function InvoiceClientField({ control }: InvoiceClientFieldProps) {
  return (
    <FormField
      control={control}
      name="clientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Client</FormLabel>
          <FormControl>
            <ClientSelector value={field.value} onChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
