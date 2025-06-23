
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DbInvoice } from '@/lib/supabase';
import { InvoiceBasicDetails } from './invoice/InvoiceBasicDetails';
import { InvoiceContactInfo } from './invoice/InvoiceContactInfo';
import { InvoiceLineItemsDisplay } from './invoice/InvoiceLineItemsDisplay';
import { InvoicePaymentDetails } from './invoice/InvoicePaymentDetails';
import { InvoiceTimeline } from './invoice/InvoiceTimeline';
import { PaymentHistory } from './PaymentHistory';
import { useInvoicePayments } from '@/hooks/useInvoicePayments';

interface InvoiceDetailsModalProps {
  invoice: DbInvoice & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
  console.log('InvoiceDetailsModal render - isOpen:', isOpen, 'invoice:', invoice);

  const { paymentSummary, loading: paymentsLoading } = useInvoicePayments(invoice.id, Number(invoice.amount));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Invoice Details</DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <InvoiceBasicDetails invoice={invoice} />
        
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            <InvoiceContactInfo invoice={invoice} />
            
            <InvoiceLineItemsDisplay 
              invoiceId={invoice.id}
              hasLineItems={invoice.has_line_items}
            />
            
            <InvoicePaymentDetails invoice={invoice} />
            
            <Separator />
            
            {/* Payment History Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Payment History</h3>
              {paymentsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading payment history...
                </div>
              ) : (
                <PaymentHistory
                  payments={paymentSummary.payments}
                  totalPaid={paymentSummary.totalPaid}
                  remainingBalance={paymentSummary.remainingBalance}
                  invoiceAmount={Number(invoice.amount)}
                />
              )}
            </div>
            
            <Separator />
            
            <InvoiceTimeline invoice={invoice} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
