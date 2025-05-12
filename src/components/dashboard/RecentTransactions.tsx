
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

// Simplified transaction interface to avoid excessive type instantiation
interface Transaction {
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

export function RecentTransactions({ projectId, dateRange, managerId }: RecentTransactionsProps) {
  const { currentCompany } = useCompany();
  
  const { 
    data: transactions, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['recent-transactions', projectId, currentCompany?.id, dateRange, managerId],
    queryFn: async () => {
      // If no current company, return empty array
      if (!currentCompany?.id) {
        console.log("No current company selected");
        return [];
      }
      
      console.log("Fetching transactions for company:", currentCompany.id);
      console.log("Filters:", { projectId, dateRange, managerId });
      
      try {
        // Build the invoices query with explicit company_id filter
        let invoicesQuery = supabase
          .from('invoices')
          .select('id, invoice_number, amount, status, client_name, created_at, project_id')
          .eq('company_id', currentCompany.id);
        
        // Build the bills query with explicit company_id filter
        let billsQuery = supabase
          .from('bills')
          .select('id, bill_number, amount, status, vendor_name, created_at, project_id')
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
          const fromDate = dateRange.from.toISOString();
          invoicesQuery = invoicesQuery.gte('created_at', fromDate);
          billsQuery = billsQuery.gte('created_at', fromDate);
        }
        
        if (dateRange?.to) {
          const toDate = dateRange.to.toISOString();
          invoicesQuery = invoicesQuery.lte('created_at', toDate);
          billsQuery = billsQuery.lte('created_at', toDate);
        }
        
        // Execute the queries and handle the results safely
        const invoicesPromise = invoicesQuery.limit(10);
        const billsPromise = billsQuery.limit(10);
        
        const [invoicesResult, billsResult] = await Promise.all([invoicesPromise, billsPromise]);
        
        // Check for errors
        if (invoicesResult.error) {
          console.error("Error fetching invoices:", invoicesResult.error);
          throw invoicesResult.error;
        }
        
        if (billsResult.error) {
          console.error("Error fetching bills:", billsResult.error);
          throw billsResult.error;
        }
        
        console.log("Invoices fetched:", invoicesResult.data?.length || 0);
        console.log("Bills fetched:", billsResult.data?.length || 0);
        
        // Map invoice data to Transaction type
        const invoices: Transaction[] = (invoicesResult.data || []).map(invoice => ({
          id: invoice.id,
          amount: invoice.amount,
          status: invoice.status,
          created_at: invoice.created_at,
          client_name: invoice.client_name,
          project_id: invoice.project_id,
          invoice_number: invoice.invoice_number,
          transactionType: 'invoice'
        }));
        
        // Map bill data to Transaction type
        const bills: Transaction[] = (billsResult.data || []).map(bill => ({
          id: bill.id,
          amount: bill.amount,
          status: bill.status,
          created_at: bill.created_at,
          client_name: bill.vendor_name, // Use vendor_name as client_name
          project_id: bill.project_id,
          bill_number: bill.bill_number,
          transactionType: 'bill'
        }));
        
        // Combine and sort by date
        const combined = [...invoices, ...bills].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5); // Get the 5 most recent transactions
        
        return combined;
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
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

  // Handle error state
  if (error) {
    console.error("Error in transactions query:", error);
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
        <div className="text-center py-8 text-red-500">
          Error loading transactions. Please try again.
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
