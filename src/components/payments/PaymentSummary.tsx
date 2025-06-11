
import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface PaymentSummaryProps {
  amount: number;
}

export function PaymentSummary({ amount }: PaymentSummaryProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="font-medium">Amount:</span>
      <span className="text-lg font-bold">{formatCurrency(amount)}</span>
    </div>
  );
}
