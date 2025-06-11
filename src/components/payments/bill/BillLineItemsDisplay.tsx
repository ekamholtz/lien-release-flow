
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface BillLineItem {
  id: string;
  description: string | null;
  amount: number;
  billable: boolean;
  invoiced: boolean;
  category_id: string | null;
  expense_categories?: {
    name: string;
  };
}

interface BillLineItemsDisplayProps {
  billId: string;
  hasLineItems: boolean;
}

export function BillLineItemsDisplay({ billId, hasLineItems }: BillLineItemsDisplayProps) {
  const { data: lineItems = [], isLoading } = useQuery({
    queryKey: ['bill-line-items', billId],
    queryFn: async () => {
      if (!hasLineItems) return [];
      
      const { data, error } = await supabase
        .from('bill_line_items')
        .select(`
          *,
          expense_categories(name)
        `)
        .eq('bill_id', billId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching bill line items:', error);
        throw error;
      }

      return data as BillLineItem[];
    },
    enabled: hasLineItems
  });

  if (!hasLineItems) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Line Items</h3>
        <p className="text-sm text-muted-foreground">This bill does not have detailed line items.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Line Items</h3>
        <p className="text-sm text-muted-foreground">Loading line items...</p>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-2">Line Items</h3>
        <p className="text-sm text-muted-foreground">No line items found for this bill.</p>
      </div>
    );
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Line Items</h3>
      <div className="space-y-3">
        {lineItems.map((item) => (
          <div key={item.id} className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {item.description || 'No description'}
                </p>
                {item.expense_categories?.name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {item.expense_categories.name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(Number(item.amount))}</p>
                <div className="flex gap-2 mt-1">
                  {item.billable && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Billable
                    </span>
                  )}
                  {item.invoiced && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Invoiced
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <Separator />
        
        <div className="flex justify-between items-center font-medium">
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
