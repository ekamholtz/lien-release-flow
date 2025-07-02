
export interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  client_name: string;
  transactionType: 'invoice' | 'bill';
  project_id?: string | null;
  // Invoice specific fields
  invoice_number?: string;
  // Bill specific fields
  bill_number?: string;
}

export interface RecentTransactionsProps {
  projectId?: string | null;
  dateRange?: { from: Date | null, to: Date | null } | null;
  managerId?: string | null;
}
