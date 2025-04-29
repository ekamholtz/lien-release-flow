
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface RecentTransactionsProps {
  projectId?: string | null;
}

export function RecentTransactions({ projectId }: RecentTransactionsProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-transactions', projectId],
    queryFn: async () => {
      let query;
      
      if (projectId === 'unassigned') {
        // Fetch from unassigned view
        query = supabase
          .from('legacy_unassigned_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
      } else {
        // We'll create a union of invoices and bills
        const { data: invoices, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, invoice_number, client_name, amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10)
          .then(result => {
            if (result.data) {
              return {
                data: result.data.map(invoice => ({
                  id: invoice.id,
                  type: 'invoice',
                  ref_number: invoice.invoice_number,
                  entity_name: invoice.client_name,
                  amount: invoice.amount,
                  status: invoice.status,
                  created_at: invoice.created_at
                })),
                error: result.error
              };
            }
            return result;
          });
          
        if (invoiceError) throw invoiceError;
        
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('id, bill_number, vendor_name, amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10)
          .then(result => {
            if (result.data) {
              return {
                data: result.data.map(bill => ({
                  id: bill.id,
                  type: 'bill',
                  ref_number: bill.bill_number,
                  entity_name: bill.vendor_name,
                  amount: bill.amount,
                  status: bill.status,
                  created_at: bill.created_at
                })),
                error: result.error
              };
            }
            return result;
          });
          
        if (billsError) throw billsError;
        
        // Combine and sort
        const combined = [...(invoices || []), ...(bills || [])];
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Filter by project if needed
        if (projectId) {
          const { data: filtered, error: filterError } = await supabase
            .from('invoices')
            .select('id, invoice_number, client_name, amount, status, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(5)
            .then(result => {
              if (result.data) {
                return {
                  data: result.data.map(invoice => ({
                    id: invoice.id,
                    type: 'invoice',
                    ref_number: invoice.invoice_number,
                    entity_name: invoice.client_name,
                    amount: invoice.amount,
                    status: invoice.status,
                    created_at: invoice.created_at
                  })),
                  error: result.error
                };
              }
              return result;
            });
            
          if (filterError) throw filterError;
          
          const { data: billsFiltered, error: billsFilterError } = await supabase
            .from('bills')
            .select('id, bill_number, vendor_name, amount, status, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(5)
            .then(result => {
              if (result.data) {
                return {
                  data: result.data.map(bill => ({
                    id: bill.id,
                    type: 'bill',
                    ref_number: bill.bill_number,
                    entity_name: bill.vendor_name,
                    amount: bill.amount,
                    status: bill.status,
                    created_at: bill.created_at
                  })),
                  error: result.error
                };
              }
              return result;
            });
            
          if (billsFilterError) throw billsFilterError;
          
          // Combine and sort filtered results
          const combinedFiltered = [...(filtered || []), ...(billsFiltered || [])];
          combinedFiltered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          return combinedFiltered.slice(0, 10);
        }
        
        return combined.slice(0, 10);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getStatusClass = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((transaction: any) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{transaction.ref_number || transaction.reference_number}</span>
                <span className="text-xs text-gray-500">{transaction.entity_name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-medium text-sm">{formatCurrency(transaction.amount)}</span>
                <span className={`text-xs px-2 py-1 rounded ${getStatusClass(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No recent transactions found
        </div>
      )}
    </div>
  );
}
