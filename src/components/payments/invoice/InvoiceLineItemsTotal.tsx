
import React from 'react';
import { formatCurrency } from "@/lib/utils";

interface InvoiceLineItem {
  id: string;
  category_id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  pricing_method: 'cost_plus_markup' | 'manual' | 'milestone';
  source_milestone_id?: string;
  source_bill_line_item_id?: string;
}

interface InvoiceLineItemsTotalProps {
  lineItems: InvoiceLineItem[];
}

export function InvoiceLineItemsTotal({ lineItems }: InvoiceLineItemsTotalProps) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const totalMarkup = subtotal - totalCost;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total Cost:</span>
          <span>{formatCurrency(totalCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Markup:</span>
          <span>{formatCurrency(totalMarkup)}</span>
        </div>
        <div className="flex justify-between font-medium text-base border-t pt-2">
          <span>Total Amount:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
