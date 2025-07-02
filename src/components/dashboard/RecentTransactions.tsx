
import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';
import { TransactionsList } from './TransactionsList';
import type { RecentTransactionsProps } from './types';

export function RecentTransactions({ projectId, dateRange, managerId }: RecentTransactionsProps) {
  const { currentCompany } = useCompany();
  
  const { 
    data: transactions, 
    isLoading,
    error
  } = useRecentTransactions({ projectId, dateRange, managerId });

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
      <TransactionsList transactions={transactions} isLoading={isLoading} />
    </div>
  );
}
