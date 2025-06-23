
import React from 'react';
import { CreditCard, Building2, FileText, Banknote, ArrowLeftRight } from 'lucide-react';
import { PaymentMethod } from '@/lib/payments/types';

interface PaymentMethodDisplayProps {
  paymentMethod: PaymentMethod;
}

export function PaymentMethodDisplay({ paymentMethod }: PaymentMethodDisplayProps) {
  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'ach':
        return <Building2 className="h-5 w-5" />;
      case 'check':
        return <FileText className="h-5 w-5" />;
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      case 'wire_transfer':
        return <ArrowLeftRight className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

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

  return {
    icon: getPaymentMethodIcon(),
    name: getPaymentMethodName()
  };
}
