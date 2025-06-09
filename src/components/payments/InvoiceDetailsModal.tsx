
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

interface InvoiceDetailsModalProps {
  invoice: DbInvoice & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
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
            
            <InvoiceTimeline invoice={invoice} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
