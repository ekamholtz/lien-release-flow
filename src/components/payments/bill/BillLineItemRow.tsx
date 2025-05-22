
import { useEffect } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { FormControl, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ExpenseCategorySelector } from './ExpenseCategorySelector';

interface BillLineItemRowProps {
  control: Control<any>;
  index: number;
  remove: (index: number) => void;
  nestIndex?: string; // For nested field array access
}

export function BillLineItemRow({ control, index, remove, nestIndex }: BillLineItemRowProps) {
  const fieldNamePrefix = nestIndex ? `${nestIndex}.${index}` : `lineItems.${index}`;
  
  // Watch amount to format it
  const amount = useWatch({
    control,
    name: `${fieldNamePrefix}.amount`,
  });

  // Format amount on change - but don't need to update here as we'll handle it directly in the input's onChange

  return (
    <div className="grid grid-cols-12 gap-3 items-start mb-2 p-2 border rounded-md">
      <div className="col-span-12 sm:col-span-3">
        <Controller
          control={control}
          name={`${fieldNamePrefix}.categoryId`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <ExpenseCategorySelector 
                  value={field.value || ''} 
                  onChange={field.onChange}
                  error={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="col-span-12 sm:col-span-4">
        <Controller
          control={control}
          name={`${fieldNamePrefix}.description`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input 
                  placeholder="Description" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      <div className="col-span-12 sm:col-span-2">
        <Controller
          control={control}
          name={`${fieldNamePrefix}.amount`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Amount"
                  className={fieldState.error ? "border-red-500" : ""}
                  {...field}
                  onChange={(e) => {
                    // Allow only numbers and decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    
                    // Immediately update form state with the cleaned value
                    // This ensures the parent component recalculates totals on each keystroke
                    field.onChange(value);
                  }}
                  // Add onBlur handler for formatting when user finishes editing
                  onBlur={(e) => {
                    // Ensure proper formatting when user finishes
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Format to a proper number if possible
                    const formattedValue = value && !isNaN(parseFloat(value)) 
                      ? parseFloat(value).toString() 
                      : '';
                    field.onChange(formattedValue);
                    field.onBlur(); // Trigger form onBlur event
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="col-span-12 sm:col-span-2 flex items-center">
        <Controller
          control={control}
          name={`${fieldNamePrefix}.billable`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <label 
                className="text-sm font-medium leading-none cursor-pointer"
                onClick={() => field.onChange(!field.value)}
              >
                Billable
              </label>
            </FormItem>
          )}
        />
      </div>
      
      <div className="col-span-12 sm:col-span-1 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          type="button" 
          onClick={() => remove(index)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
