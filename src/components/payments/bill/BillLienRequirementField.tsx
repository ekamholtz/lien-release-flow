
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from "react-hook-form";

interface BillLienRequirementFieldProps {
  control: Control<any>;
}

export function BillLienRequirementField({ control }: BillLienRequirementFieldProps) {
  return (
    <FormField
      control={control}
      name="requiresLien"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>Requires Lien Release</FormLabel>
            <FormDescription>
              Check this box if this payment requires a release of lien before funds can be released.
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}
