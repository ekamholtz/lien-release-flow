
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { DbBill } from '@/lib/supabase';
import { BillStatusBadge } from './BillStatusBadge';

interface BillDetailsModalProps {
  bill: DbBill & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

export function BillDetailsModal({ bill, isOpen, onClose }: BillDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bill {bill.bill_number}</DialogTitle>
          <DialogDescription>
            Created on {format(new Date(bill.created_at), 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-medium">Status</h3>
            <BillStatusBadge status={bill.status} />
          </div>
          <div className="text-right">
            <h3 className="font-medium">Amount</h3>
            <p className="text-xl font-bold">${bill.amount.toFixed(2)}</p>
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">Vendor Information</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">Name: {bill.vendor_name}</p>
                <p className="text-sm">Email: {bill.vendor_email}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Project</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">{bill.projects?.name || 'No Project Assigned'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Payment Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">Due Date: {format(new Date(bill.due_date), 'MMMM d, yyyy')}</p>
                {bill.requires_lien_release && (
                  <p className="text-sm text-amber-600">
                    Requires lien release before payment
                  </p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-1">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-gray-500">{format(new Date(bill.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
                
                {bill.status !== 'pending' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">
                        {bill.status === 'approved' ? 'Approved for Payment' : 
                         bill.status === 'rejected' ? 'Rejected' : 'Processed'}
                      </p>
                      <p className="text-xs text-gray-500">After {format(new Date(bill.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                
                {bill.status === 'paid' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Paid</p>
                      <p className="text-xs text-gray-500">Payment sent</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
