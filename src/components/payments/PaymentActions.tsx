
import React from 'react';
import { Button } from '@/components/ui/button';
import { PaymentMethod, OfflinePaymentData } from '@/lib/payments/types';
import { OfflinePaymentForm } from './OfflinePaymentForm';
import { UseFormReturn } from 'react-hook-form';

interface PaymentActionsProps {
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processing: boolean;
  offlinePaymentForm: UseFormReturn<OfflinePaymentData>;
  onOfflinePaymentSubmit: (data: OfflinePaymentData) => void;
  onDigitalPayment: () => void;
}

export function PaymentActions({
  paymentMethod,
  status,
  processing,
  offlinePaymentForm,
  onOfflinePaymentSubmit,
  onDigitalPayment
}: PaymentActionsProps) {
  const isOfflinePayment = ['check', 'cash', 'wire_transfer'].includes(paymentMethod);

  if (status === 'completed') {
    return null;
  }

  if (isOfflinePayment) {
    return (
      <OfflinePaymentForm
        form={offlinePaymentForm}
        onSubmit={onOfflinePaymentSubmit}
        paymentMethod={paymentMethod}
        disabled={processing}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Click the button below to process your {paymentMethod} payment.
      </p>
      <Button
        onClick={onDigitalPayment}
        disabled={processing}
        className="w-full"
      >
        {processing ? 'Processing...' : 'Process Payment'}
      </Button>
    </div>
  );
}
