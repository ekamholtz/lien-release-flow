
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
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

  const handleMethodSelection = (data: PaymentFormData) => {
    setSelectedPaymentMethod(data.paymentMethod);
    setStep('process');
  };

  const handlePaymentComplete = async (paymentId: string, offlineData?: OfflinePaymentData) => {
    try {
      console.log('Payment completed successfully');
      
      setPaymentCompleted(true);
      setStep('complete');
      
      toast({
        title: "Payment Successful",
        description: `Payment for invoice ${invoice.invoice_number} has been processed successfully.`,
      });
      
      // Wait 2 seconds before closing and triggering refresh
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
