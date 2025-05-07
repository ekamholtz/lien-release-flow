
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface BasicBillFieldsProps {
  control: Control<any>;
}

export function BasicBillFields({ control }: BasicBillFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="billNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bill Number</FormLabel>
            <FormControl>
              <Input placeholder="BILL-0000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount ($)</FormLabel>
            <FormControl>
              <Input placeholder="0.00" type="number" step="0.01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
