
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DbInvoice } from "@/lib/supabase";
import { usePayInvoiceLogic } from "./pay-invoice/usePayInvoiceLogic";
import { usePayInvoiceSteps } from "./pay-invoice/PayInvoiceSteps";
import { PayInvoiceMethodStep } from "./pay-invoice/PayInvoiceMethodStep";
import { PayInvoiceProcessStep } from "./pay-invoice/PayInvoiceProcessStep";
import { PayInvoiceCompleteStep } from "./pay-invoice/PayInvoiceCompleteStep";

interface PayInvoiceProps {
  invoice: DbInvoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function PayInvoice({ invoice, isOpen, onClose, onPaymentComplete }: PayInvoiceProps) {
  const {
    step,
    selectedPaymentMethod,
    form,
    handleMethodSelection,
    handlePaymentComplete,
    handlePaymentError,
    handleClose,
    handleBackToMethodSelection
  } = usePayInvoiceLogic(invoice, onPaymentComplete, onClose);

  const { getDialogTitle, getDialogDescription } = usePayInvoiceSteps({
    invoiceNumber: invoice.invoice_number,
    invoiceAmount: invoice.amount
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle(step, handleBackToMethodSelection)}</DialogTitle>
          <DialogDescription>{getDialogDescription(step)}</DialogDescription>
        </DialogHeader>
        
        {step === 'method' && (
          <PayInvoiceMethodStep 
            form={form}
            onSubmit={handleMethodSelection}
            onClose={handleClose}
          />
        )}

        {step === 'process' && (
          <PayInvoiceProcessStep
            amount={invoice.amount}
            paymentMethod={selectedPaymentMethod}
            invoiceId={invoice.id}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={handlePaymentError}
          />
        )}

        {step === 'complete' && (
          <PayInvoiceCompleteStep
            invoiceNumber={invoice.invoice_number}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
