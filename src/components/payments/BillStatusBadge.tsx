
import React from 'react';
import { BillStatus } from '@/lib/supabase';

interface BillStatusBadgeProps {
  status: BillStatus;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
  const getStatusConfig = (status: BillStatus) => {
    switch (status) {
      case 'pending_approval':
        return {
          classes: 'bg-amber-100 text-amber-700 border-amber-300',
          label: 'Pending Approval'
        };
      case 'pending_payment':
        return {
          classes: 'bg-sky-100 text-sky-700 border-sky-300',
          label: 'Pending Payment'
        };
      case 'paid':
        return {
          classes: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          label: 'Paid'
        };
      case 'rejected':
        return {
          classes: 'bg-rose-100 text-rose-700 border-rose-300',
          label: 'Rejected'
        };
      default:
        return {
          classes: 'bg-slate-100 text-slate-700 border-slate-300',
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  );
}
