
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from 'date-fns';
import { DbBill, BillStatus } from '@/lib/supabase';
import { BillStatusBadge } from './BillStatusBadge';
import { formatCurrency } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

interface BillLineItem {
  id: string;
  bill_id: string;
  description: string;
  amount: number;
  category_id: string;
  billable: boolean;
  category_name?: string;
}

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
  const [lineItems, setLineItems] = useState<BillLineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bill && bill.has_line_items) {
      fetchLineItems();
    }
  }, [isOpen, bill]);

  const fetchLineItems = async () => {
    if (!bill.id) return;
    
    setLoading(true);
    try {
      // Fetch line items with category names using a join
      const { data, error } = await supabase
        .from('bill_line_items')
        .select(`
          *,
          expense_categories (name)
        `)
        .eq('bill_id', bill.id);
      
      if (error) throw error;
      
      // Transform the data to include category name
      const formattedLineItems = data.map((item: any) => ({
        ...item,
        category_name: item.expense_categories?.name || 'Uncategorized'
      }));
      
      setLineItems(formattedLineItems);
    } catch (error) {
      console.error('Error fetching line items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const billableAmount = lineItems.reduce((sum, item) => sum + (item.billable ? Number(item.amount) : 0), 0);
  const nonBillableAmount = lineItems.reduce((sum, item) => sum + (!item.billable ? Number(item.amount) : 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
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
              <BillStatusBadge status={bill.status} />
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {bill.vendor_email && (
              <div>
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">Email: {bill.vendor_email}</p>
                </div>
              </div>
            )}
            
            {bill.has_line_items && (
              <div>
                <h3 className="text-sm font-medium mb-2">Line Items</h3>
                {loading ? (
                  <div className="text-center p-4">Loading line items...</div>
                ) : lineItems.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Billable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.category_name}</TableCell>
                            <TableCell>{item.description || '-'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(item.amount))}</TableCell>
                            <TableCell className="text-right">
                              {item.billable ? 'Yes' : 'No'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="bg-gray-50 p-3 flex flex-col gap-1 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Billable Subtotal:</span>
                        <span>{formatCurrency(billableAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Non-billable Subtotal:</span>
                        <span>{formatCurrency(nonBillableAmount)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-500">
                    No line items found for this bill.
                  </div>
                )}
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
