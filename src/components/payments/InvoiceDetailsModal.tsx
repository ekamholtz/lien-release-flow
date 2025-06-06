
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from 'date-fns';
import { DbInvoice } from '@/lib/supabase';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatCurrency } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  pricing_method: string;
  category_name?: string;
}

interface InvoiceDetailsModalProps {
  invoice: DbInvoice & { projects?: { name: string } };
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to determine badge variant based on status
function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case 'draft': return 'outline';
    case 'sent': return 'secondary';
    case 'approved': return 'default';
    case 'paid': return 'default';
    case 'overdue': return 'destructive';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

export function InvoiceDetailsModal({ invoice, isOpen, onClose }: InvoiceDetailsModalProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoice && invoice.has_line_items) {
      fetchLineItems();
    }
  }, [isOpen, invoice]);

  const fetchLineItems = async () => {
    if (!invoice.id) return;
    
    setLoading(true);
    try {
      // Fetch line items with category names using a join
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select(`
          *,
          expense_categories (name)
        `)
        .eq('invoice_id', invoice.id);
      
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
  const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
  const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
  const totalMarkup = totalPrice - totalCost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Invoice Details</DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Invoice #</p>
            <div className="font-medium">{invoice.invoice_number}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Amount</p>
            <div className="font-medium">{formatCurrency(Number(invoice.amount))}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Client</p>
            <div className="font-medium">{invoice.client_name}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Project</p>
            <div className="font-medium">{invoice.projects?.name || 'General'}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <div className="font-medium">{format(new Date(invoice.due_date), 'MMMM d, yyyy')}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="font-medium">
              <Badge variant={getStatusVariant(invoice.status)}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            {invoice.client_email && (
              <div>
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">Email: {invoice.client_email}</p>
                </div>
              </div>
            )}
            
            {invoice.has_line_items && (
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
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Markup</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.category_name}</TableCell>
                            <TableCell>{item.description || '-'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(item.cost))}</TableCell>
                            <TableCell className="text-right">{item.markup_percentage}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(item.price))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="bg-gray-50 p-3 flex flex-col gap-1 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Total Cost:</span>
                        <span>{formatCurrency(totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Markup:</span>
                        <span>{formatCurrency(totalMarkup)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-500">
                    No line items found for this invoice.
                  </div>
                )}
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">Payment Method: {invoice.payment_method === 'accelerated' ? 'Accelerated' : 'Regular'}</p>
                {invoice.payment_link && (
                  <p className="text-sm">
                    Payment Link: <a href={invoice.payment_link} target="_blank" className="text-blue-600 hover:underline">View</a>
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
                    <p className="text-xs text-gray-500">{format(new Date(invoice.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
                
                {invoice.status !== 'draft' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Sent to Client</p>
                      <p className="text-xs text-gray-500">After {format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                
                {invoice.status === 'paid' && (
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">Paid</p>
                      <p className="text-xs text-gray-500">Payment received</p>
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
