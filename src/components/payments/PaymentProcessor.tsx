
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';
import { PaymentMethod, OfflinePaymentData } from '@/lib/payments/types';
import { formatCurrency } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { PaymentStatusDisplay } from './PaymentStatusDisplay';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';
import { PaymentActions } from './PaymentActions';
import { PaymentHistory } from './PaymentHistory';
import { useInvoicePayments } from '@/hooks/useInvoicePayments';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

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

  const { paymentSummary, loading, refreshPayments, updateInvoiceStatus } = useInvoicePayments(entityId, amount);

  const offlinePaymentForm = useForm<OfflinePaymentData>({
    defaultValues: {
      payorName: '',
      payorCompany: '',
      paymentDetails: '',
      amount: paymentSummary.remainingBalance || amount,
      paymentDate: new Date().toISOString().split('T')[0]
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
      // Validate payment amount for offline payments
      if (isOfflinePayment() && offlineData) {
        if (!offlineData.payorName) {
          throw new Error('Payor name is required for offline payments');
        }
        if (offlineData.amount <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }
        if (offlineData.amount > paymentSummary.remainingBalance) {
          throw new Error('Payment amount cannot exceed remaining balance');
        }
      }

      // For now, simulate payment processing
      // In the future, this will integrate with Rainforestpay for credit card and ACH
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isOfflinePayment()) {
        // For offline payments, mark as completed and require the form data
        setStatus('completed');
        onPaymentComplete?.('offline-' + Date.now(), offlineData);
      } else {
        // For digital payments (future Rainforestpay integration)
        setStatus('completed');
        onPaymentComplete?.('payment-' + Date.now());
      }

      // Refresh payment data and update invoice status
      await refreshPayments();
      await updateInvoiceStatus(paymentSummary);
      
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

  // Update form default amount when remaining balance changes
  React.useEffect(() => {
    if (!loading && paymentSummary.remainingBalance > 0) {
      offlinePaymentForm.setValue('amount', paymentSummary.remainingBalance);
    }
  }, [paymentSummary.remainingBalance, loading, offlinePaymentForm]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading payment information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment History */}
      <PaymentHistory
        payments={paymentSummary.payments}
        totalPaid={paymentSummary.totalPaid}
        remainingBalance={paymentSummary.remainingBalance}
        invoiceAmount={amount}
      />

      {/* Payment Processor - Only show if there's remaining balance */}
      {paymentSummary.remainingBalance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {name} Payment
            </CardTitle>
            <CardDescription>
              Process {formatCurrency(paymentSummary.remainingBalance)} remaining balance for {entityType}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
      )}
    </div>
  );
}
