
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control } from "react-hook-form";
import { CreditCard, Building2, FileText, Banknote, ArrowLeftRight } from 'lucide-react';

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
                      {isInvoice ? 'Client pays by check (offline payment)' : 'Pay vendor by check (offline payment)'}
                    </p>
                  </div>
                </div>
              </FormItem>

              <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50">
                <FormControl>
                  <RadioGroupItem value="cash" />
                </FormControl>
                <div className="flex items-center space-x-3 flex-1">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <FormLabel className="font-normal cursor-pointer">
                      Cash
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {isInvoice ? 'Client pays with cash (offline payment)' : 'Pay vendor with cash (offline payment)'}
                    </p>
                  </div>
                </div>
              </FormItem>

              <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-gray-50">
                <FormControl>
                  <RadioGroupItem value="wire_transfer" />
                </FormControl>
                <div className="flex items-center space-x-3 flex-1">
                  <ArrowLeftRight className="h-5 w-5 text-purple-600" />
                  <div>
                    <FormLabel className="font-normal cursor-pointer">
                      Wire Transfer
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {isInvoice ? 'Client pays via wire transfer (offline payment)' : 'Pay vendor via wire transfer (offline payment)'}
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
