
import React from 'react';
import { InvoiceStatus } from '@/lib/supabase';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          classes: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'Draft'
        };
      case 'sent':
        return {
          classes: 'bg-sky-100 text-sky-700 border-sky-300',
          label: 'Sent'
        };
      case 'partially_paid':
        return {
          classes: 'bg-amber-100 text-amber-700 border-amber-300',
          label: 'Partially Paid'
        };
      case 'paid':
        return {
          classes: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          label: 'Paid'
        };
      case 'overdue':
        return {
          classes: 'bg-rose-100 text-rose-700 border-rose-300',
          label: 'Overdue'
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
