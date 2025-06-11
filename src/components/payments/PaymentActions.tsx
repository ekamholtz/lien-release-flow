
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Loader2, FileText } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { PaymentMethod, PaymentStatus, OfflinePaymentData } from '@/lib/payments/types';
import { OfflinePaymentForm } from './OfflinePaymentForm';

interface PaymentActionsProps {
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
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
  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return 'Credit Card';
      case 'ach':
        return 'ACH Transfer';
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

  const isOfflinePayment = () => {
    return ['check', 'cash', 'wire_transfer'].includes(paymentMethod);
  };

  if (isOfflinePayment() && status === 'pending') {
    return (
      <>
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Please fill in the payment details to record this {getPaymentMethodName().toLowerCase()} payment.
          </AlertDescription>
        </Alert>

        <Form {...offlinePaymentForm}>
          <form onSubmit={offlinePaymentForm.handleSubmit(onOfflinePaymentSubmit)} className="space-y-4">
            <OfflinePaymentForm 
              control={offlinePaymentForm.control} 
              paymentMethod={paymentMethod}
            />
            
            <Button 
              type="submit"
              disabled={processing || status === 'completed'}
              className="w-full"
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record {getPaymentMethodName()} Payment
            </Button>
          </form>
        </Form>
      </>
    );
  }

  if (!isOfflinePayment() && status === 'pending') {
    return (
      <>
        <Alert>
          <AlertDescription>
            Digital payments will be processed through Rainforestpay integration (coming soon).
          </AlertDescription>
        </Alert>

        <Button 
          onClick={onDigitalPayment}
          disabled={processing || status === 'completed'}
          className="w-full"
        >
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Process {getPaymentMethodName()} Payment
        </Button>
      </>
    );
  }

  if (status === 'completed') {
    return (
      <Button disabled className="w-full">
        Payment Completed
      </Button>
    );
  }

  return null;
}
