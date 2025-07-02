
import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PaymentMethod } from '@/lib/payments/types';

interface PaymentStatusDisplayProps {
  status: string; // Changed from PaymentStatus to string to match actual usage
  paymentMethod: PaymentMethod;
}

export function PaymentStatusDisplay({ status, paymentMethod }: PaymentStatusDisplayProps) {
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

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'completed':
        return isOfflinePayment()
          ? `${getPaymentMethodName()} payment recorded successfully!`
          : 'Payment completed successfully!';
      case 'failed':
        return 'Payment failed. Please try again.';
      case 'processing':
        return 'Processing payment...';
      default:
        return `Ready to process ${getPaymentMethodName().toLowerCase()} payment`;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {getStatusIcon()}
      <span>{getStatusMessage()}</span>
    </div>
  );
}
