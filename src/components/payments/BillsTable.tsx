
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { format } from 'date-fns';
import { BillStatusBadge } from './BillStatusBadge';
import { BillActions } from './BillActions';
import { DbBill, BillStatus } from '@/lib/supabase';

// Define an extended bill type that includes the project name from the join
type ExtendedBill = DbBill & {
  projects?: { 
    name: string;
  };
};

interface BillsTableProps {
  bills: ExtendedBill[];
  onUpdateStatus: (billId: string, newStatus: BillStatus) => Promise<void>;
  onPayBill: (bill: ExtendedBill) => void;
  onViewDetails: (bill: ExtendedBill) => void;
  onSyncComplete?: () => void;
}

export function BillsTable({ bills, onUpdateStatus, onPayBill, onViewDetails, onSyncComplete }: BillsTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill Number</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-construction-600" />
                  {bill.bill_number}
                </div>
              </TableCell>
              <TableCell>{bill.vendor_name}</TableCell>
              <TableCell>
                {bill.project_id ? (
                  // @ts-ignore - projects is returned from the join
                  bill.projects?.name || 'Unknown Project'
                ) : 'No Project'}
              </TableCell>
              <TableCell>${bill.amount.toFixed(2)}</TableCell>
              <TableCell>{format(new Date(bill.due_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <BillStatusBadge status={bill.status} />
              </TableCell>
              <TableCell className="text-right">
                <BillActions 
                  bill={bill} 
                  onUpdateStatus={onUpdateStatus} 
                  onPayBill={onPayBill}
                  onViewDetails={onViewDetails}
                  onSyncComplete={onSyncComplete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
