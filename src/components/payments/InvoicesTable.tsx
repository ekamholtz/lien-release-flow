
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { format } from 'date-fns';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoiceActions } from './InvoiceActions';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { QboSyncStatusBadge } from './QboSyncStatus';

// Define an extended invoice type that includes the project name from the join
// and QBO sync fields
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
  qbo_sync_status?: 'pending' | 'processing' | 'success' | 'error' | null;
  qbo_error?: { message: string } | null;
  qbo_invoice_id?: string | null;
  qbo_retries?: number;
  qbo_last_synced_at?: string | null;
};

interface InvoicesTableProps {
  invoices: ExtendedInvoice[];
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>;
  onPayInvoice: (invoice: ExtendedInvoice) => void;
  onViewDetails: (invoice: ExtendedInvoice) => void;
}

export function InvoicesTable({ invoices, onUpdateStatus, onPayInvoice, onViewDetails }: InvoicesTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>QBO Sync</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-construction-600" />
                  {invoice.invoice_number}
                </div>
              </TableCell>
              <TableCell>{invoice.client_name}</TableCell>
              <TableCell>
                {invoice.project_id ? (
                  // @ts-ignore - projects is returned from the join
                  invoice.projects?.name || 'Unknown Project'
                ) : 'No Project'}
              </TableCell>
              <TableCell>${invoice.amount.toFixed(2)}</TableCell>
              <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
              </TableCell>
              <TableCell>
                {invoice.qbo_sync_status !== undefined && (
                  <QboSyncStatusBadge 
                    status={invoice.qbo_sync_status} 
                    errorMessage={invoice.qbo_error?.message}
                    retries={invoice.qbo_retries}
                    lastSynced={invoice.qbo_last_synced_at}
                  />
                )}
              </TableCell>
              <TableCell className="text-right">
                <InvoiceActions 
                  invoice={invoice} 
                  onUpdateStatus={onUpdateStatus} 
                  onPayInvoice={onPayInvoice}
                  onViewDetails={onViewDetails}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
