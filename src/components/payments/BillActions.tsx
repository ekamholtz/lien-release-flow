
import React from 'react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { BillStatus, DbBill } from '@/lib/supabase';

interface BillActionsProps {
  bill: DbBill;
  onUpdateStatus: (billId: string, newStatus: BillStatus) => Promise<void>;
  onPayBill: (bill: DbBill) => void;
}

export function BillActions({ bill, onUpdateStatus, onPayBill }: BillActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {bill.status === 'pending' && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-green-600"
                  onClick={() => onUpdateStatus(bill.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Approve</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-600"
                  onClick={() => onUpdateStatus(bill.id, 'rejected')}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reject</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
      
      {bill.status === 'approved' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-blue-600"
                onClick={() => onPayBill(bill)}
              >
                <DollarSign className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pay Bill</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
