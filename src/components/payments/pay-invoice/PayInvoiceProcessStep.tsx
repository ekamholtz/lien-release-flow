
import React from 'react';
import { PaymentProcessor } from '../PaymentProcessor';
import { PaymentMethod, OfflinePaymentData } from '@/lib/payments/types';

interface PayInvoiceProcessStepProps {
  amount: number;
  paymentMethod: PaymentMethod;
  invoiceId: string;
  onPaymentComplete: (paymentId: string, offlineData?: OfflinePaymentData) => void;
  onPaymentError: (error: string) => void;
}

export function PayInvoiceProcessStep({
  amount,
  paymentMethod,
  invoiceId,
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
        onPaymentComplete={onPaymentComplete}
        onPaymentError={onPaymentError}
      />
    </div>
  );
}
