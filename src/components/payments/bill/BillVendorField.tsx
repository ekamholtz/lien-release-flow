
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { VendorSelector } from '../../vendors/VendorSelector';

interface BillVendorFieldProps {
  control: Control<any>;
}

export function BillVendorField({ control }: BillVendorFieldProps) {
  return (
    <FormField
      control={control}
      name="vendorId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Vendor</FormLabel>
          <FormControl>
            <VendorSelector value={field.value} onChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
