
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { DbInvoice } from '@/lib/supabase';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatCurrency } from "@/lib/utils";

interface InvoiceDetailsModalProps {
  invoice: DbInvoice & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to determine badge variant based on status
function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case 'draft': return 'outline';
    case 'sent': return 'secondary';
    case 'approved': return 'default';
    case 'paid': return 'default';
    case 'overdue': return 'destructive';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Invoice Details</DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Invoice #</p>
            <div className="font-medium">{invoice.invoice_number}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Amount</p>
            <div className="font-medium">{formatCurrency(Number(invoice.amount))}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Client</p>
            <div className="font-medium">{invoice.client_name}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Project</p>
            <div className="font-medium">{invoice.projects?.name || 'General'}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <div className="font-medium">{format(new Date(invoice.due_date), 'MMMM d, yyyy')}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="font-medium">
              <Badge variant={getStatusVariant(invoice.status)}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {invoice.client_email && (
              <div>
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">Email: {invoice.client_email}</p>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
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
