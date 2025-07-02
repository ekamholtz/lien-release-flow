
import React from 'react';
import { PaymentProcessor } from '../PaymentProcessor';
import { PaymentMethod, OfflinePaymentData } from '@/lib/payments/types';
import { DbInvoice } from '@/lib/supabase';

interface PayInvoiceProcessStepProps {
  amount: number;
  paymentMethod: PaymentMethod;
  invoiceId: string;
  invoice: DbInvoice; // Add the full invoice data
  onPaymentComplete: (paymentId: string, offlineData?: OfflinePaymentData) => void;
  onPaymentError: (error: string) => void;
}

export function PayInvoiceProcessStep({
  amount,
  paymentMethod,
  invoiceId,
  invoice,
  onPaymentComplete,
  onPaymentError
}: PayInvoiceProcessStepProps) {
  return (
    <div className="py-4">
      <PaymentProcessor
        amount={amount}
        paymentMethod={paymentMethod}
        entityType="invoice"
        entityId={invoiceId}
        invoice={invoice}
        onPaymentComplete={onPaymentComplete}
        onPaymentError={onPaymentError}
      />
    </div>
  );
}
