
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentTransaction, InvoicePaymentSummary, PaymentMethod } from '@/lib/payments/types';

export function useInvoicePayments(invoiceId: string, invoiceAmount: number) {
  const [paymentSummary, setPaymentSummary] = useState<InvoicePaymentSummary>({
    totalPaid: 0,
    remainingBalance: invoiceAmount,
    isFullyPaid: false,
    isPartiallyPaid: false,
    payments: []
  });
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('entity_type', 'invoice')
        .eq('entity_id', invoiceId)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      // Convert database results to PaymentTransaction interface
      const typedPayments: PaymentTransaction[] = (payments || []).map(payment => ({
        ...payment,
        amount: Number(payment.amount),
        payment_method: payment.payment_method as PaymentMethod
      }));

      const totalPaid = typedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingBalance = Math.max(0, invoiceAmount - totalPaid);
      const isFullyPaid = remainingBalance === 0 && totalPaid > 0;
      const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0;

      setPaymentSummary({
        totalPaid,
        remainingBalance,
        isFullyPaid,
        isPartiallyPaid,
        payments: typedPayments
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (summary: InvoicePaymentSummary) => {
    try {
      let newStatus = 'sent'; // Default status
      
      if (summary.isFullyPaid) {
        newStatus = 'paid';
      } else if (summary.isPartiallyPaid) {
        newStatus = 'partially_paid';
      }

      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [invoiceId]);

  return {
    paymentSummary,
    loading,
    refreshPayments: fetchPayments,
    updateInvoiceStatus
  };
}
