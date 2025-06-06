import { useEffect } from 'react';
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { BillLineItemRow } from "./BillLineItemRow";

interface BillLineItemsProps {
  control: Control<any>;
}

export function BillLineItems({ control }: BillLineItemsProps) {
  const { setValue, watch } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems"
  });
  
  // Watch all line item amounts to calculate total
  const lineItems = watch("lineItems") || [];
  
  // Specifically watch for changes to any amount field within line items
  // This creates an array of all the amount values that will trigger the effect when any single amount changes
  const lineItemAmounts = lineItems.map((item: any) => item?.amount);
  
  // Calculate total amount whenever any line item amount changes
  useEffect(() => {
    if (lineItems && lineItems.length > 0) {
      // Calculate total from all line items (both billable and non-billable)
      const total = lineItems.reduce((sum: number, item: any) => {
        const amount = parseFloat(item.amount) || 0;
        return sum + amount;
      }, 0);
      
      // Update the form's amount field with the calculated total
      setValue("amount", total.toFixed(2));
      
      // Log for debugging
      console.log("Line items total calculated:", total.toFixed(2), "from", lineItems.length, "items");
    } else {
      setValue("amount", "0");
    }
  }, [lineItems, lineItemAmounts, setValue]);

  return (
    <FormField
      control={control}
      name="lineItems"
      render={() => (
        <FormItem className="space-y-4">
          <FormLabel className="text-base font-medium">Line Items</FormLabel>
          
          {fields.length === 0 ? (
            <div className="p-4 text-center border border-dashed rounded-md bg-muted/20">
              No line items added. Add your first line item below.
            </div>
          ) : (
            <div className="space-y-1">
              {fields.map((field, index) => (
                <BillLineItemRow
                  key={field.id}
                  control={control}
                  index={index}
                  remove={remove}
                />
              ))}
            </div>
          )}
          
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                append({
                  categoryId: "",
                  description: "",
                  amount: "",
                  billable: false
                });
              }}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
            </Button>
          </div>
          
          {fields.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <div className="space-y-1 text-right">
                <div>
                  <span className="font-medium">Total Amount: </span>
                  <span className="font-semibold">
                    ${parseFloat(watch("amount") || "0").toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Billable: ${lineItems.reduce((sum: number, item: any) => 
                      sum + (item.billable ? (parseFloat(item.amount) || 0) : 0), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Non-billable: ${lineItems.reduce((sum: number, item: any) => 
                      sum + (!item.billable ? (parseFloat(item.amount) || 0) : 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
