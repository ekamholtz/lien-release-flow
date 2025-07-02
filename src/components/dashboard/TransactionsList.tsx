
import React from 'react';
import { TransactionItem } from './TransactionItem';
import { TransactionsLoadingSkeleton } from './TransactionsLoadingSkeleton';
import type { Transaction } from './types';

interface TransactionsListProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
}

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  if (isLoading) {
    return <TransactionsLoadingSkeleton />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent transactions
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
