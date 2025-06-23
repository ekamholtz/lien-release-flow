
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { PaymentMethodSelector } from '../PaymentMethodSelector';
import { PaymentMethod } from '@/lib/payments/types';

interface PaymentFormData {
  paymentMethod: PaymentMethod;
}

interface PayInvoiceMethodStepProps {
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  onClose: () => void;
}

export function PayInvoiceMethodStep({ form, onSubmit, onClose }: PayInvoiceMethodStepProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PaymentMethodSelector control={form.control} type="invoice" />
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-construction-600 hover:bg-construction-700">
            Continue
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
