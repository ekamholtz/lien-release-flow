
import type { Transaction } from '@/components/dashboard/types';

export function mapInvoicesToTransactions(invoices: any[]): Transaction[] {
  return invoices.map(invoice => ({
    id: invoice.id,
    amount: invoice.amount,
    status: invoice.status,
    created_at: invoice.created_at,
    client_name: invoice.client_name,
    project_id: invoice.project_id,
    invoice_number: invoice.invoice_number,
    transactionType: 'invoice' as const
  }));
}

export function mapBillsToTransactions(bills: any[]): Transaction[] {
  return bills.map(bill => ({
    id: bill.id,
    amount: bill.amount,
    status: bill.status,
    created_at: bill.created_at,
    client_name: bill.vendor_name, // Use vendor_name as client_name
    project_id: bill.project_id,
    bill_number: bill.bill_number,
    transactionType: 'bill' as const
  }));
}

export function combineAndSortTransactions(invoices: Transaction[], bills: Transaction[]): Transaction[] {
  return [...invoices, ...bills]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5); // Get the 5 most recent transactions
}
