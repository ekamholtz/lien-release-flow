
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { BillStatus } from '@/lib/supabase';

interface BillStatusBadgeProps {
  status: BillStatus;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
  switch (status) {
    case 'pending_approval':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Approval</Badge>;
    case 'pending_payment':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending Payment</Badge>;
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
