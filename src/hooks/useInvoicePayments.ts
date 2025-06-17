
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentTransaction, InvoicePaymentSummary, PaymentMethod, PaymentProvider, DbPaymentTransaction } from '@/lib/payments/types';

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
      console.log(`Fetching payments for invoice ${invoiceId}`);
      
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('entity_type', 'invoice')
        .eq('entity_id', invoiceId)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      console.log(`Found ${payments?.length || 0} payments for invoice ${invoiceId}:`, payments);

      // Convert database results to PaymentTransaction interface with proper type safety
      const typedPayments: PaymentTransaction[] = (payments || []).map((payment: DbPaymentTransaction) => ({
        id: payment.id,
        entity_type: payment.entity_type,
        entity_id: payment.entity_id,
        amount: Number(payment.amount),
        payment_method: payment.payment_method as PaymentMethod,
        payment_provider: payment.payment_provider as PaymentProvider,
        provider_transaction_id: payment.provider_transaction_id || undefined,
        status: payment.status,
        payment_date: payment.payment_date || undefined,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        company_id: payment.company_id,
        user_id: payment.user_id || undefined,
        metadata: payment.metadata || undefined,
        notes: payment.notes || undefined,
        payment_type: payment.payment_type || undefined,
        payor_name: payment.payor_name || undefined,
        payor_company: payment.payor_company || undefined,
        payment_details: payment.payment_details || undefined,
        is_offline: payment.is_offline || false
      }));

      const totalPaid = typedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingBalance = Math.max(0, invoiceAmount - totalPaid);
      const isFullyPaid = remainingBalance === 0 && totalPaid > 0;
      const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0;

      console.log(`Payment summary for invoice ${invoiceId}:`, {
        totalPaid,
        remainingBalance,
        isFullyPaid,
        isPartiallyPaid,
        invoiceAmount
      });

      const newSummary = {
        totalPaid,
        remainingBalance,
        isFullyPaid,
        isPartiallyPaid,
        payments: typedPayments
      };

      setPaymentSummary(newSummary);

      // Update invoice status based on payment summary
      await updateInvoiceStatus(newSummary);
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

      console.log(`Updating invoice ${invoiceId} status from current to ${newStatus}`);

      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      console.log(`Invoice ${invoiceId} status successfully updated to ${newStatus}`);
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
