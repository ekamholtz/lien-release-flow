
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    
    // Auto-calculate price when cost or markup changes for cost_plus_markup method
    if (field === 'cost' || field === 'markup_percentage') {
      if (updatedItem.pricing_method === 'cost_plus_markup') {
        updatedItem.price = Number(updatedItem.cost) * (1 + Number(updatedItem.markup_percentage) / 100);
      }
    }
    
    onUpdate(updatedItem);
  };

  const handlePricingMethodChange = (method: string) => {
    const updatedItem = { ...lineItem, pricing_method: method as any };
    
    // Recalculate price based on new method
    if (method === 'cost_plus_markup') {
      updatedItem.price = Number(updatedItem.cost) * (1 + Number(updatedItem.markup_percentage) / 100);
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
      
      <div className="col-span-3">
        <Input
          placeholder="Description"
          value={lineItem.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
        />
      </div>
      
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Cost"
          value={lineItem.cost || ''}
          onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
          disabled={lineItem.pricing_method === 'milestone'}
        />
      </div>
      
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Markup %"
          value={lineItem.markup_percentage || ''}
          onChange={(e) => handleFieldChange('markup_percentage', parseFloat(e.target.value) || 0)}
          disabled={lineItem.pricing_method !== 'cost_plus_markup'}
        />
      </div>
      
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Price"
          value={lineItem.price || ''}
          onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
          disabled={lineItem.pricing_method === 'cost_plus_markup'}
        />
      </div>
      
      <div className="col-span-2">
        <Select value={lineItem.pricing_method} onValueChange={handlePricingMethodChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="cost_plus_markup">Cost + Markup</SelectItem>
            <SelectItem value="milestone">Milestone</SelectItem>
          </SelectContent>
        </Select>
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
