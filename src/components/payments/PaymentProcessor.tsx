
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
import { supabase } from '@/integrations/supabase/client';
import { DbInvoice } from '@/lib/supabase';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface PaymentProcessorProps {
  amount: number;
  paymentMethod: PaymentMethod;
  entityType: 'invoice' | 'bill';
  entityId: string;
  invoice?: DbInvoice;
  onPaymentComplete?: (paymentId: string, offlineData?: OfflinePaymentData) => void;
  onPaymentError?: (error: string) => void;
}

export function PaymentProcessor({
  amount,
  paymentMethod,
  entityType,
  entityId,
  invoice,
  onPaymentComplete,
  onPaymentError
}: PaymentProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  const { paymentSummary, loading, refreshPayments } = useInvoicePayments(entityId, amount);

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

  const triggerQboSync = async (paymentId: string) => {
    try {
      console.log('Triggering QBO sync for payment:', paymentId);
      
      // Get user session for access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('No session found for QBO sync');
        return;
      }

      // Create sync record to trigger QBO integration
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'payment',
        p_entity_id: paymentId,
        p_provider: 'qbo',
        p_status: 'pending'
      });

      console.log('QBO sync triggered for payment:', paymentId);
    } catch (error) {
      console.error('Failed to trigger QBO sync:', error);
      // Don't fail the payment if sync trigger fails
    }
  };

  const handlePayment = async (offlineData?: OfflinePaymentData) => {
    // Prevent double submission
    if (processing) {
      console.log('Payment already processing, ignoring duplicate submission');
      return;
    }

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

        // Check for duplicate payments before saving
        console.log('Checking for duplicate payments...');
        const { data: existingPayments, error: checkError } = await supabase
          .from('payments')
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('payment_method', paymentMethod)
          .eq('amount', offlineData.amount)
          .eq('payor_name', offlineData.payorName)
          .eq('payment_details', offlineData.paymentDetails || '')
          .eq('payment_date', new Date(offlineData.paymentDate).toISOString().split('T')[0]);

        if (checkError) {
          console.error('Error checking for duplicates:', checkError);
          throw checkError;
        }

        if (existingPayments && existingPayments.length > 0) {
          console.log('Found existing payment with same details:', existingPayments);
          throw new Error('A payment with identical details already exists. Please verify the payment information.');
        }
      }

      if (isOfflinePayment() && offlineData) {
        console.log('Processing offline payment:', offlineData);
        
        // Use the company_id from the invoice if available, otherwise use from existing payments
        const companyId = invoice?.company_id || paymentSummary.payments[0]?.company_id;
        
        if (!companyId) {
          throw new Error('Company ID is required to process payment');
        }
        
        // Save the offline payment to the database
        const paymentData = {
          entity_type: entityType,
          entity_id: entityId,
          amount: offlineData.amount,
          payment_method: paymentMethod,
          payment_provider: 'offline',
          status: 'completed',
          payment_date: new Date(offlineData.paymentDate).toISOString(),
          payor_name: offlineData.payorName,
          payor_company: offlineData.payorCompany || null,
          payment_details: offlineData.paymentDetails || null,
          is_offline: true,
          company_id: companyId
        };

        console.log('Saving payment to database:', paymentData);

        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert([paymentData])
          .select()
          .single();

        if (paymentError) {
          console.error('Error saving payment:', paymentError);
          throw paymentError;
        }

        console.log('Payment saved successfully:', payment);

        // Trigger QBO sync for the new payment
        await triggerQboSync(payment.id);

        // Refresh payment data to get updated totals
        await refreshPayments();
        
        setStatus('completed');
        onPaymentComplete?.(payment.id, offlineData);
      } else {
        // For digital payments (future Rainforestpay integration)
        console.log('Processing digital payment...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStatus('completed');
        onPaymentComplete?.('payment-' + Date.now());
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      console.error('Payment processing error:', err);
      setError(errorMessage);
      setStatus('failed');
      onPaymentError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleOfflinePaymentSubmit = (data: OfflinePaymentData) => {
    console.log('Offline payment form submitted:', data);
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
