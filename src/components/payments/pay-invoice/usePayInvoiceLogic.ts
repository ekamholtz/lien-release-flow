
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DbInvoice } from '@/lib/supabase';
import { PaymentMethod, OfflinePaymentData } from '@/lib/payments/types';
import { PayInvoiceStep } from './PayInvoiceSteps';

interface PaymentFormData {
  paymentMethod: PaymentMethod;
}

export function usePayInvoiceLogic(
  invoice: DbInvoice,
  onPaymentComplete: () => void,
  onClose: () => void
) {
  const [step, setStep] = useState<PayInvoiceStep>('method');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const form = useForm<PaymentFormData>({
    defaultValues: {
      paymentMethod: 'credit_card'
    }
  });

  const isOfflinePayment = (method: PaymentMethod) => {
    return ['check', 'cash', 'wire_transfer'].includes(method);
  };

  const handleMethodSelection = (data: PaymentFormData) => {
    setSelectedPaymentMethod(data.paymentMethod);
    setStep('process');
  };

  const calculateInvoiceStatus = async (invoiceId: string, invoiceAmount: number) => {
    // Get all completed payments for this invoice
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('entity_type', 'invoice')
      .eq('entity_id', invoiceId)
      .eq('status', 'completed');

    if (error) {
      console.error('Error fetching payments:', error);
      return 'sent'; // Default status
    }

    const totalPaid = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
    const remainingBalance = invoiceAmount - totalPaid;

    if (remainingBalance <= 0) {
      return 'paid';
    } else if (totalPaid > 0) {
      return 'partially_paid';
    } else {
      return 'sent';
    }
  };

  const handlePaymentComplete = async (paymentId: string, offlineData?: OfflinePaymentData) => {
    try {
      const isOffline = isOfflinePayment(selectedPaymentMethod);
      const paymentAmount = offlineData?.amount || invoice.amount;
      
      // Create payment record with offline data if applicable
      const paymentData = {
        entity_type: 'invoice' as const,
        entity_id: invoice.id,
        amount: paymentAmount,
        payment_method: selectedPaymentMethod,
        payment_provider: isOffline ? 'offline' as const : 'rainforestpay' as const,
        provider_transaction_id: paymentId,
        status: 'completed' as const,
        payment_date: offlineData?.paymentDate ? new Date(offlineData.paymentDate).toISOString() : new Date().toISOString(),
        company_id: invoice.company_id,
        is_offline: isOffline,
        ...(offlineData && {
          payment_type: selectedPaymentMethod,
          payor_name: offlineData.payorName,
          payor_company: offlineData.payorCompany,
          payment_details: offlineData.paymentDetails
        })
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);
      
      if (paymentError) {
        throw paymentError;
      }

      // Calculate and update invoice status based on total payments
      const newStatus = await calculateInvoiceStatus(invoice.id, invoice.amount);
      
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: newStatus,
          ...(newStatus === 'paid' && {
            payment_id: paymentId,
            payment_date: paymentData.payment_date,
            payment_provider: paymentData.payment_provider,
            payment_method: selectedPaymentMethod
          })
        })
        .eq('id', invoice.id);
      
      if (invoiceError) {
        throw invoiceError;
      }
      
      setPaymentCompleted(true);
      setStep('complete');
      
      const statusMessage = newStatus === 'paid' ? 'fully paid' : 'partially paid';
      toast({
        title: "Payment Successful",
        description: `Payment for invoice ${invoice.invoice_number} has been processed successfully. Invoice is now ${statusMessage}.`,
      });
      
      // Wait 2 seconds before closing for user to see success message
      setTimeout(() => {
        onPaymentComplete();
        onClose();
        // Reset state for next time
        setStep('method');
        setPaymentCompleted(false);
      }, 2000);
      
    } catch (error) {
      console.error("Payment processing error:", error);
      
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
  };

  const handleClose = () => {
    setStep('method');
    setPaymentCompleted(false);
    form.reset();
    onClose();
  };

  const handleBackToMethodSelection = () => {
    setStep('method');
  };

  return {
    step,
    selectedPaymentMethod,
    paymentCompleted,
    form,
    handleMethodSelection,
    handlePaymentComplete,
    handlePaymentError,
    handleClose,
    handleBackToMethodSelection
  };
}
