
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control } from "react-hook-form";
import { CreditCard, Building2, FileText } from 'lucide-react';

interface PaymentMethodSelectorProps {
  control: Control<any>;
  type?: 'invoice' | 'bill';
}

export function PaymentMethodSelector({ control, type = 'invoice' }: PaymentMethodSelectorProps) {
  const isInvoice = type === 'invoice';
  
  return (
    <FormField
      control={control}
      name="paymentMethod"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Payment Method</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-3"
            >
              <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50">
                <FormControl>
                  <RadioGroupItem value="credit_card" />
                </FormControl>
                <div className="flex items-center space-x-3 flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <FormLabel className="font-normal cursor-pointer">
                      Credit Card
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {isInvoice ? 'Client pays with credit card (processed via Rainforestpay)' : 'Pay vendor with credit card'}
                    </p>
                  </div>
                </div>
              </FormItem>
              
              <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50">
                <FormControl>
                  <RadioGroupItem value="ach" />
                </FormControl>
                <div className="flex items-center space-x-3 flex-1">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <div>
                    <FormLabel className="font-normal cursor-pointer">
                      ACH Transfer
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {isInvoice ? 'Client pays via bank transfer (processed via Rainforestpay)' : 'Pay vendor via ACH bank transfer'}
                    </p>
                  </div>
                </div>
              </FormItem>
              
              <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50">
                <FormControl>
                  <RadioGroupItem value="check" />
                </FormControl>
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <div>
                    <FormLabel className="font-normal cursor-pointer">
                      Check
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {isInvoice ? 'Client pays by check (manual processing)' : 'Pay vendor by check (manual processing)'}
                    </p>
                  </div>
                </div>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
