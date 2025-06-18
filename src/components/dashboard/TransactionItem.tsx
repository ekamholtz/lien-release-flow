
import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceStatusBadge } from '@/components/payments/InvoiceStatusBadge';
import { BillStatusBadge } from '@/components/payments/BillStatusBadge';
import type { Transaction } from './types';

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
      <div>
        <div className="flex items-center space-x-2">
          <p className="font-medium text-sm">
            {transaction.transactionType === 'invoice' 
              ? `Invoice #${transaction.invoice_number}` 
              : `Bill #${transaction.bill_number}`}
          </p>
          {transaction.transactionType === 'invoice' ? (
            <InvoiceStatusBadge status={transaction.status as any} />
          ) : (
            <BillStatusBadge status={transaction.status as any} />
          )}
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
  );
}
