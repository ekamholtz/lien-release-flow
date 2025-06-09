
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { DbInvoice } from '@/lib/supabase';
import { formatCurrency } from "@/lib/utils";

interface InvoiceBasicDetailsProps {
  invoice: DbInvoice & { projects?: { name: string } };
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

export function InvoiceBasicDetails({ invoice }: InvoiceBasicDetailsProps) {
  return (
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
  );
}
