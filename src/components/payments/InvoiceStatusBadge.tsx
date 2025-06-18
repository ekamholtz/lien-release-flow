
import React from 'react';
import { InvoiceStatus } from '@/lib/supabase';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const getStatusClasses = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return 'border-gray-300 bg-gray-100 text-gray-800';
      case 'sent':
        return 'border-blue-300 bg-blue-100 text-blue-800';
      case 'partially_paid':
        return 'border-yellow-300 bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'border-green-300 bg-green-100 text-green-800';
      case 'overdue':
        return 'border-red-300 bg-red-100 text-red-800';
      default:
        return 'border-gray-300 bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent';
      case 'partially_paid':
        return 'Partially Paid';
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getStatusClasses(status)}`}>
      {getStatusLabel(status)}
    </div>
  );
}
