
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { useCompany } from '@/contexts/CompanyContext';

interface RecentTransactionsProps {
  projectId?: string | null;
  dateRange?: { from: Date | null, to: Date | null } | null;
  managerId?: string | null;
}

export function RecentTransactions({ projectId, dateRange, managerId }: RecentTransactionsProps) {
  const { currentCompany } = useCompany();
  
  const { 
    data: transactions, 
    isLoading 
  } = useQuery({
    queryKey: ['recent-transactions', projectId, currentCompany?.id, dateRange, managerId],
    queryFn: async () => {
      // If no current company, return empty array
      if (!currentCompany?.id) {
        return [];
      }
      
      // Build the invoices query
      let invoicesQuery = supabase
        .from('invoices')
        .select('id, invoice_number, amount, status, client_name, created_at, type:invoice_type, project_id, project_manager_id')
        .eq('company_id', currentCompany.id);
      
      // Build the bills query
      let billsQuery = supabase
        .from('bills')
        .select('id, bill_number, amount, status, vendor_name as client_name, created_at, type:bill_type, project_id, project_manager_id')
        .eq('company_id', currentCompany.id);
      
      // Apply additional filters to both queries
      
      // Filter by project if specified
      if (projectId === 'unassigned') {
        invoicesQuery = invoicesQuery.is('project_id', null);
        billsQuery = billsQuery.is('project_id', null);
      } else if (projectId) {
        invoicesQuery = invoicesQuery.eq('project_id', projectId);
        billsQuery = billsQuery.eq('project_id', projectId);
      }
      
      // Filter by project manager if specified
      if (managerId) {
        invoicesQuery = invoicesQuery.eq('project_manager_id', managerId);
        billsQuery = billsQuery.eq('project_manager_id', managerId);
      }
      
      // Filter by date range if specified
      if (dateRange?.from) {
        invoicesQuery = invoicesQuery.gte('created_at', dateRange.from.toISOString());
        billsQuery = billsQuery.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        invoicesQuery = invoicesQuery.lte('created_at', dateRange.to.toISOString());
        billsQuery = billsQuery.lte('created_at', dateRange.to.toISOString());
      }
      
      // Execute the queries and merge the results
      const [invoicesResult, billsResult] = await Promise.all([
        invoicesQuery.limit(10),
        billsQuery.limit(10)
      ]);
      
      // Check for errors
      if (invoicesResult.error) throw invoicesResult.error;
      if (billsResult.error) throw billsResult.error;
      
      // Combine the results and sort by date
      const combined = [
        ...(invoicesResult.data || []).map(i => ({ ...i, transactionType: 'invoice' })),
        ...(billsResult.data || []).map(b => ({ ...b, transactionType: 'bill' }))
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5); // Get the 5 most recent transactions
      
      return combined;
    },
    enabled: !!currentCompany?.id
  });

  if (!currentCompany?.id) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
        <div className="text-center py-8 text-gray-500">
          Please select a company to view transactions
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map(transaction => (
            <div key={transaction.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-sm">
                    {transaction.transactionType === 'invoice' 
                      ? `Invoice #${transaction.invoice_number}` 
                      : `Bill #${transaction.bill_number}`}
                  </p>
                  <Badge 
                    variant={transaction.status === 'paid' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {transaction.status}
                  </Badge>
                </div>
                <div className="flex items-center mt-1">
                  <p className="text-xs text-gray-500">{transaction.client_name}</p>
                  <p className="text-xs text-gray-400 mx-2">•</p>
                  <p className="text-xs text-gray-500">{formatDate(new Date(transaction.created_at))}</p>
                </div>
              </div>
              <span className={`font-medium ${transaction.transactionType === 'invoice' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.transactionType === 'invoice' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No recent transactions
        </div>
      )}
    </div>
  );
}
