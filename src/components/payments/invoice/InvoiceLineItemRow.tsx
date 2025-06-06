
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { ExpenseCategorySelector } from '../bill/ExpenseCategorySelector';

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

interface InvoiceLineItemRowProps {
  lineItem: InvoiceLineItem;
  onUpdate: (item: InvoiceLineItem) => void;
  onRemove: () => void;
}

export function InvoiceLineItemRow({ lineItem, onUpdate, onRemove }: InvoiceLineItemRowProps) {
  const handleFieldChange = (field: keyof InvoiceLineItem, value: any) => {
    const updatedItem = { ...lineItem, [field]: value };
    
    // Auto-calculate price when cost or markup changes, but allow manual override
    if (field === 'cost' || field === 'markup_percentage') {
      if (updatedItem.cost > 0 && updatedItem.markup_percentage >= 0) {
        updatedItem.price = Number(updatedItem.cost) * (1 + Number(updatedItem.markup_percentage) / 100);
        updatedItem.pricing_method = 'cost_plus_markup';
      }
    }
    
    // When price is manually changed, switch to manual pricing method
    if (field === 'price') {
      updatedItem.pricing_method = 'manual';
    }
    
    onUpdate(updatedItem);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
      <div className="col-span-2">
        <ExpenseCategorySelector
          value={lineItem.category_id}
          onChange={(value) => handleFieldChange('category_id', value)}
        />
      </div>
      
      <div className="col-span-4">
        <Input
          placeholder="Description"
          value={lineItem.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
        />
      </div>
      
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Cost"
          value={lineItem.cost || ''}
          onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Markup %"
          value={lineItem.markup_percentage || ''}
          onChange={(e) => handleFieldChange('markup_percentage', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Price"
          value={lineItem.price || ''}
          onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
        />
      </div>
      
      <div className="col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
