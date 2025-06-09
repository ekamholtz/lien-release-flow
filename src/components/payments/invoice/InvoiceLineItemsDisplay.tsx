
import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
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

interface InvoiceLineItemsDisplayProps {
  invoiceId: string;
  hasLineItems?: boolean;
}

export function InvoiceLineItemsDisplay({ invoiceId, hasLineItems }: InvoiceLineItemsDisplayProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasLineItems) {
      fetchLineItems();
    }
  }, [invoiceId, hasLineItems]);

  const fetchLineItems = async () => {
    if (!invoiceId) return;
    
    setLoading(true);
    try {
      // Fetch line items with category names using a join
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select(`
          *,
          expense_categories (name)
        `)
        .eq('invoice_id', invoiceId);
      
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

  if (!hasLineItems) {
    return null;
  }

  // Calculate totals
  const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
  const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
  const totalMarkup = totalPrice - totalCost;

  return (
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
  );
}
