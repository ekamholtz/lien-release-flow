
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Loader2, CreditCard, Building2, FileText, CheckCircle, XCircle, Banknote, ArrowLeftRight } from 'lucide-react';
import { PaymentMethod, PaymentStatus } from '@/lib/payments/types';
import { formatCurrency } from '@/lib/utils';
import { OfflinePaymentForm } from './OfflinePaymentForm';
import { useForm } from 'react-hook-form';

interface OfflinePaymentData {
  payorName: string;
  payorCompany?: string;
  paymentDetails?: string;
}

interface PaymentProcessorProps {
  amount: number;
  paymentMethod: PaymentMethod;
  entityType: 'invoice' | 'bill';
  entityId: string;
  onPaymentComplete?: (paymentId: string, offlineData?: OfflinePaymentData) => void;
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

  const offlinePaymentForm = useForm<OfflinePaymentData>({
    defaultValues: {
      payorName: '',
      payorCompany: '',
      paymentDetails: ''
    }
  });

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

  const isOfflinePayment = () => {
    return ['check', 'cash', 'wire_transfer'].includes(paymentMethod);
  };

  const handlePayment = async (offlineData?: OfflinePaymentData) => {
    setProcessing(true);
    setError(null);
    setStatus('processing');

    try {
      // For now, simulate payment processing
      // In the future, this will integrate with Rainforestpay for credit card and ACH
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isOfflinePayment()) {
        // For offline payments, mark as completed and require the form data
        if (!offlineData?.payorName) {
          throw new Error('Payor name is required for offline payments');
        }
        setStatus('completed');
        onPaymentComplete?.('offline-' + Date.now(), offlineData);
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

  const handleOfflinePaymentSubmit = (data: OfflinePaymentData) => {
    handlePayment(data);
  };

  const handleDigitalPayment = () => {
    handlePayment();
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

        {isOfflinePayment() && status === 'pending' && (
          <>
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Please fill in the payment details to record this {getPaymentMethodName().toLowerCase()} payment.
              </AlertDescription>
            </Alert>

            <Form {...offlinePaymentForm}>
              <form onSubmit={offlinePaymentForm.handleSubmit(handleOfflinePaymentSubmit)} className="space-y-4">
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
        )}

        {!isOfflinePayment() && status === 'pending' && (
          <>
            <Alert>
              <AlertDescription>
                Digital payments will be processed through Rainforestpay integration (coming soon).
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleDigitalPayment}
              disabled={processing || status === 'completed'}
              className="w-full"
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process {getPaymentMethodName()} Payment
            </Button>
          </>
        )}

        {status === 'completed' && (
          <Button disabled className="w-full">
            Payment Completed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
