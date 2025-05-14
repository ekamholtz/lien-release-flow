import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DbInvoice, DbBill } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";

type PaymentType = 'invoice' | 'bill';

// Define common fields that might be in both invoice and bill
type CommonPaymentFields = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  projects?: { name: string };
  accounting_sync?: {
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: { message: string; type?: string } | null;
    error_message?: string | null;
    retries?: number;
    last_synced_at?: string | null;
  } | null;
  // Optional fields that might exist on either type
  invoice_number?: string;
  bill_number?: string;
  client_name?: string;
  vendor_name?: string;
  issue_date?: string;
  paid_date?: string;
  notes?: string;
  payment_details?: {
    method?: string;
    reference?: string;
    date?: string;
  };
};

interface PaymentDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: (CommonPaymentFields & (DbInvoice | DbBill)) | null;
  type: PaymentType;
}

// Helper component for detail items
function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}

// Helper function to determine badge variant based on status
function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case 'draft': return 'outline';
    case 'sent': return 'secondary';
    case 'approved': return 'default';
    case 'paid': return 'default'; // Changed from 'success' to 'default' for compatibility
    case 'overdue': return 'destructive';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

// Helper function to format date string
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function PaymentDetailDialog({ isOpen, onClose, payment, type }: PaymentDetailDialogProps) {
  if (!payment) return null;
  
  // Determine which fields to use based on type
  const number = type === 'invoice' ? payment.invoice_number : payment.bill_number;
  const clientVendor = type === 'invoice' ? payment.client_name : payment.vendor_name;
  const title = type === 'invoice' ? 'Invoice' : 'Bill';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {title} Details
          </DialogTitle>
          <DialogDescription>
            {title} #{number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Main details section */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailItem label={`${title} #`} value={number} />
            <DetailItem label="Amount" value={formatCurrency(Number(payment.amount))} />
            <DetailItem label={type === 'invoice' ? 'Client' : 'Vendor'} value={clientVendor} />
            <DetailItem label="Project" value={payment.projects?.name || 'General'} />
            <DetailItem label="Issue Date" value={formatDate(payment.issue_date)} />
            <DetailItem label="Due Date" value={formatDate(payment.due_date)} />
            <DetailItem 
              label="Status" 
              value={
                <Badge variant={getStatusVariant(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              } 
            />
            {payment.paid_date && (
              <DetailItem label="Paid Date" value={formatDate(payment.paid_date)} />
            )}
          </div>
          
          <Separator />
          
          {/* Additional details if available */}
          {payment.notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{payment.notes}</p>
            </div>
          )}
          
          {/* Payment details if paid */}
          {payment.status === 'paid' && payment.payment_details && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Payment Method" value={payment.payment_details.method} />
                  <DetailItem label="Reference" value={payment.payment_details.reference || 'N/A'} />
                  {payment.payment_details.date && (
                    <DetailItem label="Transaction Date" value={formatDate(payment.payment_details.date)} />
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* QBO Sync Status */}
          {payment.accounting_sync && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">QuickBooks Sync Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem 
                    label="Status" 
                    value={
                      <Badge variant={
                        payment.accounting_sync.status === 'success' ? 'default' : 
                        payment.accounting_sync.status === 'error' ? 'destructive' : 
                        'secondary'
                      }>
                        {payment.accounting_sync.status.charAt(0).toUpperCase() + payment.accounting_sync.status.slice(1)}
                      </Badge>
                    } 
                  />
                  {payment.accounting_sync.last_synced_at && (
                    <DetailItem label="Last Synced" value={formatDate(payment.accounting_sync.last_synced_at)} />
                  )}
                  {payment.accounting_sync.error_message && (
                    <div className="col-span-2">
                      <DetailItem label="Error" value={
                        <span className="text-red-500">{payment.accounting_sync.error_message}</span>
                      } />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
