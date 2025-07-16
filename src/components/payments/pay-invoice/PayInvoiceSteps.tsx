
import React from 'react';
import { CreditCard, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PayInvoiceStep = 'method' | 'process' |'digitalPay'| 'complete';

interface PayInvoiceStepsProps {
  step: PayInvoiceStep;
  invoiceNumber: string;
  invoiceAmount: number;
  onBackToMethodSelection?: () => void;
}

export function usePayInvoiceSteps({ invoiceNumber, invoiceAmount }: { invoiceNumber: string; invoiceAmount: number }) {
  const getDialogTitle = (step: PayInvoiceStep, onBackToMethodSelection?: () => void) => {
    switch (step) {
      case 'method':
        return (
          <div className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Select Payment Method
          </div>
        );
      case 'process':
        return (
          <div className="flex items-center">
            {onBackToMethodSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMethodSelection}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Process Payment
          </div>
        );
      case 'complete':
        return (
          <div className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-green-500" />
            Payment Successful
          </div>
        );
      default:
        return 'Pay Invoice';
    }
  };

  const getDialogDescription = (step: PayInvoiceStep) => {
    switch (step) {
      case 'method':
        return `Choose how you want to pay invoice ${invoiceNumber} - $${invoiceAmount.toFixed(2)}`;
      case 'process':
        return `Complete payment for invoice ${invoiceNumber} - $${invoiceAmount.toFixed(2)}`;
      case 'complete':
        return `Your payment for invoice ${invoiceNumber} has been processed successfully.`;
      default:
        return '';
    }
  };

  return {
    getDialogTitle,
    getDialogDescription
  };
}
