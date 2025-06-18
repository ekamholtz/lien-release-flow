
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from '@/lib/supabase';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="!border-gray-300 !bg-gray-100 !text-gray-800 hover:!bg-gray-100">Draft</Badge>;
    case 'sent':
      return <Badge variant="outline" className="!border-blue-300 !bg-blue-100 !text-blue-800 hover:!bg-blue-100">Sent</Badge>;
    case 'partially_paid':
      return <Badge variant="outline" className="!border-yellow-300 !bg-yellow-100 !text-yellow-800 hover:!bg-yellow-100">Partially Paid</Badge>;
    case 'paid':
      return <Badge variant="outline" className="!border-green-300 !bg-green-100 !text-green-800 hover:!bg-green-100">Paid</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
