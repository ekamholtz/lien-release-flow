
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface OfflinePaymentFormData {
  payorName: string;
  payorCompany?: string;
  paymentDetails?: string;
  amount: number;
  paymentDate: string;
}

interface OfflinePaymentFormProps {
  control: Control<OfflinePaymentFormData>;
  paymentMethod: string;
  invoiceAmount?: number;
}

export function OfflinePaymentForm({ control, paymentMethod, invoiceAmount }: OfflinePaymentFormProps) {
  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'check':
        return 'Check';
      case 'cash':
        return 'Cash';
      case 'wire_transfer':
        return 'Wire Transfer';
      default:
        return 'Payment';
    }
  };

  const getPaymentDetailsPlaceholder = () => {
    switch (paymentMethod) {
      case 'check':
        return 'Check number, bank name, etc.';
      case 'wire_transfer':
        return 'Wire reference number, bank details, etc.';
      case 'cash':
        return 'Receipt number, notes, etc.';
      default:
        return 'Additional payment details';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  max={invoiceAmount}
                  placeholder={invoiceAmount ? `Max: $${invoiceAmount.toFixed(2)}` : "0.00"}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Date *</FormLabel>
              <FormControl>
                <Input 
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="payorName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payor Name *</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter the name of the person/entity making the payment"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="payorCompany"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payor Company (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter company name if applicable"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="paymentDetails"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {getPaymentMethodLabel()} Details (Optional)
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder={getPaymentDetailsPlaceholder()}
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
