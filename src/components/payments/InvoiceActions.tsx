
import React from 'react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye, Send, CreditCard, ExternalLink } from "lucide-react";
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';

interface InvoiceActionsProps {
  invoice: DbInvoice;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>;
  onPayInvoice: (invoice: DbInvoice) => void;
}

export function InvoiceActions({ invoice, onUpdateStatus, onPayInvoice }: InvoiceActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {invoice.status === 'draft' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-blue-600"
                onClick={() => onUpdateStatus(invoice.id, 'sent')}
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send Invoice</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-green-600"
                onClick={() => onPayInvoice(invoice)}
              >
                <CreditCard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Record Payment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {invoice.status === 'paid' && invoice.payment_link && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-blue-600"
                onClick={() => window.open(invoice.payment_link, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Payment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
