import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, CreditCard, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DbInvoice } from "@/lib/supabase";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PaymentProcessor } from "./PaymentProcessor";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { PaymentMethod, OfflinePaymentData } from "@/lib/payments/types";

interface PayInvoiceProps {
  invoice: DbInvoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

interface PaymentFormData {
  paymentMethod: PaymentMethod;
}

export function PayInvoice({ invoice, isOpen, onClose, onPaymentComplete }: PayInvoiceProps) {
  const [step, setStep] = useState<'method' | 'process' | 'complete'>('method');
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

  const isOfflinePayment = (method: PaymentMethod) => {
    return ['check', 'cash', 'wire_transfer'].includes(method);
  };

  const handlePaymentComplete = async (paymentId: string, offlineData?: OfflinePaymentData) => {
    try {
      const isOffline = isOfflinePayment(selectedPaymentMethod);
      
      // Update invoice status in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_id: paymentId,
          payment_date: new Date().toISOString(),
          payment_provider: isOffline ? 'offline' : 'rainforestpay',
          payment_method: selectedPaymentMethod
        })
        .eq('id', invoice.id);
      
      if (error) {
        throw error;
      }

      // Create payment record with offline data if applicable
      const paymentData = {
        entity_type: 'invoice' as const,
        entity_id: invoice.id,
        amount: invoice.amount,
        payment_method: selectedPaymentMethod,
        payment_provider: isOffline ? 'offline' as const : 'rainforestpay' as const,
        provider_transaction_id: paymentId,
        status: 'completed' as const,
        payment_date: new Date().toISOString(),
        company_id: invoice.company_id,
        is_offline: isOffline,
        ...(offlineData && {
          payment_type: selectedPaymentMethod,
          payor_name: offlineData.payorName,
          payor_company: offlineData.payorCompany,
          payment_details: offlineData.paymentDetails
        })
      };

      await supabase
        .from('payments')
        .insert(paymentData);
      
      setPaymentCompleted(true);
      setStep('complete');
      
      toast({
        title: "Payment Successful",
        description: `Payment for invoice ${invoice.invoice_number} has been processed successfully.`,
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

  const getDialogTitle = () => {
    switch (step) {
      case 'method':
        return (
          <div className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Select Payment Method
          </div>
        );
      case 'process':
        return (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToMethodSelection}
              className="mr-2 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            Process Payment
          </div>
        );
      case 'complete':
        return (
          <div className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-green-500" />
            Payment Successful
          </div>
        );
      default:
        return 'Pay Invoice';
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case 'method':
        return `Choose how you want to pay invoice ${invoice.invoice_number} - $${invoice.amount.toFixed(2)}`;
      case 'process':
        return `Complete payment for invoice ${invoice.invoice_number} - $${invoice.amount.toFixed(2)}`;
      case 'complete':
        return `Your payment for invoice ${invoice.invoice_number} has been processed successfully.`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        
        {step === 'method' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleMethodSelection)} className="space-y-6">
              <PaymentMethodSelector control={form.control} type="invoice" />
              
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-construction-600 hover:bg-construction-700">
                  Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === 'process' && (
          <div className="py-4">
            <PaymentProcessor
              amount={invoice.amount}
              paymentMethod={selectedPaymentMethod}
              entityType="invoice"
              entityId={invoice.id}
              onPaymentComplete={handlePaymentComplete}
              onPaymentError={handlePaymentError}
            />
          </div>
        )}

        {step === 'complete' && (
          <div className="py-8 text-center">
            <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium mb-2">Payment Completed Successfully!</p>
            <p className="text-muted-foreground">
              Invoice {invoice.invoice_number} has been marked as paid.
            </p>
            
            <DialogFooter className="mt-6">
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
