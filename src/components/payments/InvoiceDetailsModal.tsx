
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { DbInvoice } from '@/lib/supabase';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceDetailsModalProps {
  invoice: DbInvoice & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
          <DialogDescription>
            Created on {format(new Date(invoice.created_at), 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-medium">Status</h3>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="text-right">
            <h3 className="font-medium">Amount</h3>
            <p className="text-xl font-bold">${invoice.amount.toFixed(2)}</p>
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">Client Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">Name: {invoice.client_name}</p>
                <p className="text-sm">Email: {invoice.client_email}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Project</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">{invoice.projects?.name || 'No Project Assigned'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Payment Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">Due Date: {format(new Date(invoice.due_date), 'MMMM d, yyyy')}</p>
                <p className="text-sm">Payment Method: {invoice.payment_method === 'accelerated' ? 'Accelerated' : 'Regular'}</p>
                {invoice.payment_link && (
                  <p className="text-sm">
                    Payment Link: <a href={invoice.payment_link} target="_blank" className="text-blue-600 hover:underline">View</a>
                  </p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-1">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-gray-500">{format(new Date(invoice.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
                
                {invoice.status !== 'draft' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Sent to Client</p>
                      <p className="text-xs text-gray-500">After {format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                
                {invoice.status === 'paid' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Paid</p>
                      <p className="text-xs text-gray-500">Payment received</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
