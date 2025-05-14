
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoiceActions } from './InvoiceActions';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { QboSyncStatus } from './QboSyncStatus';
import { ExternalLink, Eye, SendHorizontal } from 'lucide-react';
import { PaymentDetailDialog } from './PaymentDetailDialog';

// Update the type definition to make fields optional where needed
interface InvoicesTableProps {
  invoices: Array<DbInvoice & { 
    projects?: { name: string };
    accounting_sync?: {
      status: 'pending' | 'processing' | 'success' | 'error';
      error?: { message: string; type?: string } | null;
      error_message?: string | null;
      retries?: number;
      last_synced_at?: string | null;
    } | null;
  }>;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>; // Updated to return Promise<void>
  onPayInvoice: (invoice: any) => void;
  onViewDetails: (invoice: any) => void;
  onRetrySync?: (invoiceId: string) => void;
  isRetrySyncing?: boolean;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onUpdateStatus,
  onPayInvoice,
  onViewDetails,
  onRetrySync,
  isRetrySyncing
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
    // Still call the original handler if provided
    if (onViewDetails) {
      onViewDetails(invoice);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US').format(date);
  };
  
  // Updated to return a Promise
  const handleSendInvoice = async (invoice: DbInvoice) => {
    await onUpdateStatus(invoice.id, 'sent');
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>QBO Sync</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.client_name}</TableCell>
              <TableCell>{invoice.projects?.name || 'General'}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(invoice.amount))}</TableCell>
              <TableCell>{formatDate(invoice.due_date)}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>
                <QboSyncStatus 
                  syncStatus={invoice.accounting_sync} 
                  small={true}
                  onRetry={onRetrySync ? () => onRetrySync(invoice.id) : undefined}
                  isRetrying={isRetrySyncing}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline" 
                    size="icon"
                    onClick={() => handleViewDetails(invoice)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {invoice.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSendInvoice(invoice)}
                      title="Send Invoice"
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <InvoiceActions 
                    invoice={invoice}
                    onPayInvoice={onPayInvoice} 
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={onUpdateStatus}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Add the detail dialog */}
      <PaymentDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        payment={selectedInvoice}
        type="invoice"
      />
    </div>
  );
};
