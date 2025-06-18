
import React from 'react';
import { BillStatus } from '@/lib/supabase';

interface BillStatusBadgeProps {
  status: BillStatus;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
  const getStatusClasses = (status: BillStatus) => {
    switch (status) {
      case 'pending_approval':
        return 'border-yellow-300 bg-yellow-100 text-yellow-800';
      case 'pending_payment':
        return 'border-blue-300 bg-blue-100 text-blue-800';
      case 'paid':
        return 'border-green-300 bg-green-100 text-green-800';
      case 'rejected':
        return 'border-red-300 bg-red-100 text-red-800';
      default:
        return 'border-gray-300 bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: BillStatus) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'pending_payment':
        return 'Pending Payment';
      case 'paid':
        return 'Paid';
      case 'rejected':
        return 'Rejected';
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
