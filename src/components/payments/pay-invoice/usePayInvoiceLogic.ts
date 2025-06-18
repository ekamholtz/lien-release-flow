
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

  const calculateAndUpdateInvoiceStatus = async (invoiceId: string, invoiceAmount: number) => {
    try {
      // Get all completed payments for this invoice
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('entity_type', 'invoice')
        .eq('entity_id', invoiceId)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching payments for status calculation:', error);
        return 'sent'; // Default status
      }

      const totalPaid = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const remainingBalance = invoiceAmount - totalPaid;

      let newStatus = 'sent';
      if (remainingBalance <= 0 && totalPaid > 0) {
        newStatus = 'paid';
      } else if (totalPaid > 0 && remainingBalance > 0) {
        newStatus = 'partially_paid';
      }

      console.log(`Calculated invoice status: ${newStatus}. Total paid: ${totalPaid}, Remaining: ${remainingBalance}`);

      // Update the invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice status:', updateError);
        throw updateError;
      }

      console.log(`Invoice ${invoiceId} status updated to ${newStatus}`);
      return newStatus;
    } catch (error) {
      console.error('Error in calculateAndUpdateInvoiceStatus:', error);
      return 'sent';
    }
  };

  const handlePaymentComplete = async (paymentId: string, offlineData?: OfflinePaymentData) => {
    try {
      console.log('Payment completed, updating invoice status...');
      
      // Calculate and update the invoice status
      const newStatus = await calculateAndUpdateInvoiceStatus(invoice.id, invoice.amount);
      
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
