
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from "react-hook-form";

interface InvoiceOptionsProps {
  control: Control<any>;
}

export function InvoiceOptions({ control }: InvoiceOptionsProps) {
  return (
    <>
      <FormField
        control={control}
        name="includePaymentLink"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Include Payment Link</FormLabel>
              <FormDescription>
                Include a payment link with this invoice that will be sent to the customer.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="sendLienRelease"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Send Lien Release on Payment</FormLabel>
              <FormDescription>
                Automatically send a release of lien to the customer when payment is complete.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
