
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface OfflinePaymentFormData {
  payorName: string;
  payorCompany?: string;
  paymentDetails?: string;
}

interface OfflinePaymentFormProps {
  control: Control<OfflinePaymentFormData>;
  paymentMethod: string;
}

export function OfflinePaymentForm({ control, paymentMethod }: OfflinePaymentFormProps) {
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

  return (
    <div className="space-y-4">
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
                placeholder={`Enter additional details about the ${getPaymentMethodLabel().toLowerCase()} payment (e.g., check number, reference number, etc.)`}
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
