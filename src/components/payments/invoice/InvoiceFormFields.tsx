
import { Control } from "react-hook-form";
import { BasicInvoiceFields } from "./BasicInvoiceFields";
import { InvoiceClientField } from "./InvoiceClientField";
import { InvoiceProjectField } from "./InvoiceProjectField";
import { InvoiceDueDateField } from "./InvoiceDueDateField";
import { InvoiceDescriptionField } from "./InvoiceDescriptionField";
import { InvoiceProjectManagerField } from "./InvoiceProjectManagerField";
import { InvoiceLineItems } from "./InvoiceLineItems";
import { PaymentMethodSelector } from "../PaymentMethodSelector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface InvoiceLineItem {
  id: string;
  category_id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  pricing_method: 'cost_plus_markup' | 'manual' | 'milestone';
  source_milestone_id?: string;
  source_bill_line_item_id?: string;
}

interface InvoiceFormFieldsProps {
  control: Control<any>;
  lineItems?: InvoiceLineItem[];
  onLineItemsChange?: (items: InvoiceLineItem[]) => void;
  useLineItems?: boolean;
  onUseLineItemsChange?: (use: boolean) => void;
}

export function InvoiceFormFields({ 
  control, 
  lineItems = [], 
  onLineItemsChange = () => {}, 
  useLineItems = false, 
  onUseLineItemsChange = () => {} 
}: InvoiceFormFieldsProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Calculate total from line items
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <div className="space-y-6">
      <BasicInvoiceFields control={control} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InvoiceClientField control={control} />
        <InvoiceProjectField 
          control={control} 
          onProjectChange={(projectId) => setSelectedProjectId(projectId)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InvoiceDueDateField control={control} />
        <InvoiceProjectManagerField control={control} />
      </div>

      {/* Line Items Toggle */}
      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-gray-50">
        <Switch
          id="use-line-items"
          checked={useLineItems}
          onCheckedChange={onUseLineItemsChange}
        />
        <Label htmlFor="use-line-items">Use detailed line items instead of single amount</Label>
      </div>

      {/* Amount or Line Items */}
      {useLineItems ? (
        <div>
          <InvoiceLineItems
            lineItems={lineItems}
            onLineItemsChange={onLineItemsChange}
            projectId={selectedProjectId}
          />
          {/* Hidden field to update the form amount with line items total */}
          <FormField
            control={control}
            name="amount"
            render={({ field }) => {
              // Update form amount when line items total changes
              if (lineItemsTotal !== parseFloat(field.value || '0')) {
                field.onChange(lineItemsTotal.toString());
              }
              return <input type="hidden" {...field} value={lineItemsTotal.toString()} />;
            }}
          />
        </div>
      ) : (
        <FormField
          control={control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Payment Method Selection */}
      <PaymentMethodSelector control={control} type="invoice" />
      
      <InvoiceDescriptionField control={control} />
    </div>
  );
}
