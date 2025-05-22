
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { DbBill, BillStatus } from '@/lib/supabase';
import { BillStatusBadge } from './BillStatusBadge';
import { formatCurrency } from "@/lib/utils";

interface BillDetailsModalProps {
  bill: DbBill & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to determine badge variant based on status
function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case 'pending_approval': return 'outline';
    case 'pending_payment': return 'default';
    case 'paid': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

export function BillDetailsModal({ bill, isOpen, onClose }: BillDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Bill Details</DialogTitle>
          <DialogDescription>
            Bill #{bill.bill_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Bill #</p>
            <div className="font-medium">{bill.bill_number}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Amount</p>
            <div className="font-medium">{formatCurrency(Number(bill.amount))}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Vendor</p>
            <div className="font-medium">{bill.vendor_name}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Project</p>
            <div className="font-medium">{bill.projects?.name || 'General'}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <div className="font-medium">{format(new Date(bill.due_date), 'MMMM d, yyyy')}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="font-medium">
              <Badge variant={getStatusVariant(bill.status)}>
                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {bill.vendor_email && (
              <div>
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">Email: {bill.vendor_email}</p>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
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
                
                {bill.status !== 'pending_approval' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">
                        {bill.status === 'pending_payment' ? 'Approved for Payment' : 
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
