
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Building2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '@/lib/payments/types';
import { formatCurrency } from '@/lib/utils';

interface PaymentProcessorProps {
  amount: number;
  paymentMethod: PaymentMethod;
  entityType: 'invoice' | 'bill';
  entityId: string;
  onPaymentComplete?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export function PaymentProcessor({
  amount,
  paymentMethod,
  entityType,
  entityId,
  onPaymentComplete,
  onPaymentError
}: PaymentProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'ach':
        return <Building2 className="h-5 w-5" />;
      case 'check':
        return <FileText className="h-5 w-5" />;
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
      default:
        return 'Payment';
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);
    setStatus('processing');

    try {
      // For now, simulate payment processing
      // In the future, this will integrate with Rainforestpay for credit card and ACH
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (paymentMethod === 'check') {
        // For check payments, mark as pending and require manual confirmation
        setStatus('pending');
        onPaymentComplete?.('manual-check-' + Date.now());
      } else {
        // For digital payments (future Rainforestpay integration)
        setStatus('completed');
        onPaymentComplete?.('payment-' + Date.now());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setStatus('failed');
      onPaymentError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
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
        return paymentMethod === 'check' 
          ? 'Check payment recorded. Please process the physical check.'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPaymentMethodIcon()}
          {getPaymentMethodName()} Payment
        </CardTitle>
        <CardDescription>
          Process {formatCurrency(amount)} payment for {entityType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Amount:</span>
          <span className="text-lg font-bold">{formatCurrency(amount)}</span>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getStatusIcon()}
          <span>{getStatusMessage()}</span>
        </div>

        {paymentMethod === 'check' && status === 'pending' && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              For check payments, you'll need to manually process the physical check and update the payment status once cleared.
            </AlertDescription>
          </Alert>
        )}

        {(paymentMethod === 'credit_card' || paymentMethod === 'ach') && status === 'pending' && (
          <Alert>
            <AlertDescription>
              Digital payments will be processed through Rainforestpay integration (coming soon).
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handlePayment}
          disabled={processing || status === 'completed'}
          className="w-full"
        >
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === 'completed' 
            ? 'Payment Completed' 
            : `Process ${getPaymentMethodName()} Payment`
          }
        </Button>
      </CardContent>
    </Card>
  );
}
