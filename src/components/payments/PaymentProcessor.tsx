
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';
import { PaymentMethod, PaymentStatus, OfflinePaymentData } from '@/lib/payments/types';
import { formatCurrency } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { PaymentStatusDisplay } from './PaymentStatusDisplay';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';
import { PaymentSummary } from './PaymentSummary';
import { PaymentActions } from './PaymentActions';

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

  const { icon, name } = PaymentMethodDisplay({ paymentMethod });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {name} Payment
        </CardTitle>
        <CardDescription>
          Process {formatCurrency(amount)} payment for {entityType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentSummary amount={amount} />

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <PaymentStatusDisplay status={status} paymentMethod={paymentMethod} />

        <PaymentActions
          paymentMethod={paymentMethod}
          status={status}
          processing={processing}
          offlinePaymentForm={offlinePaymentForm}
          onOfflinePaymentSubmit={handleOfflinePaymentSubmit}
          onDigitalPayment={handleDigitalPayment}
        />
      </CardContent>
    </Card>
  );
}
