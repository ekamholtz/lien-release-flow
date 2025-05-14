
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye, Check, X, CreditCard } from "lucide-react";
import { DbBill, BillStatus } from '@/lib/supabase';
import { PaymentDetailDialog } from './PaymentDetailDialog';

interface BillActionsProps {
  bill: DbBill;
  onUpdateStatus: (billId: string, newStatus: BillStatus) => Promise<void>;
  onPayBill: (bill: DbBill) => void;
  onViewDetails: (bill: DbBill) => void;
}

export function BillActions({ bill, onUpdateStatus, onPayBill, onViewDetails }: BillActionsProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const handleViewDetails = (bill: DbBill) => {
    setIsDetailOpen(true);
    // Still call the original handler if provided
    if (onViewDetails) {
      onViewDetails(bill);
    }
  };
  return (
    <div className="flex items-center justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-500"
              onClick={() => handleViewDetails(bill)}
            >
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
                  <Check className="h-4 w-4" />
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
                  <X className="h-4 w-4" />
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
                <CreditCard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pay Bill</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Add the detail dialog */}
      <PaymentDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        payment={bill}
        type="bill"
      />
    </div>
  );
}
