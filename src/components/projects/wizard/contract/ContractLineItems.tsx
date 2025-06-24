
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ExpenseCategorySelector } from '@/components/payments/bill/ExpenseCategorySelector';

export interface ContractLineItem {
  id: string;
  description: string;
  categoryId: string;
  amount: number;
  notes?: string;
}

interface ContractLineItemsProps {
  lineItems: ContractLineItem[];
  onChange: (lineItems: ContractLineItem[]) => void;
}

export function ContractLineItems({ lineItems, onChange }: ContractLineItemsProps) {
  const addLineItem = () => {
    const newItem: ContractLineItem = {
      id: `item-${Date.now()}`,
      description: '',
      categoryId: '',
      amount: 0,
      notes: ''
    };
    onChange([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof ContractLineItem, value: string | number) => {
    const updatedItems = lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(updatedItems);
  };

  const removeLineItem = (id: string) => {
    const updatedItems = lineItems.filter(item => item.id !== id);
    onChange(updatedItems);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Contract Line Items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLineItem}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {lineItems.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No line items added yet. Click "Add Item" to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-4">
                  <Label htmlFor={`description-${item.id}`} className="text-sm">
                    Description
                  </Label>
                  <Input
                    id={`description-${item.id}`}
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder="Enter description"
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <Label htmlFor={`category-${item.id}`} className="text-sm">
                    Category
                  </Label>
                  <div className="mt-1">
                    <ExpenseCategorySelector
                      value={item.categoryId}
                      onChange={(value) => updateLineItem(item.id, 'categoryId', value)}
                      error={!item.categoryId}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`amount-${item.id}`} className="text-sm">
                    Amount
                  </Label>
                  <Input
                    id={`amount-${item.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.amount || ''}
                    onChange={(e) => updateLineItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`notes-${item.id}`} className="text-sm">
                    Notes
                  </Label>
                  <Input
                    id={`notes-${item.id}`}
                    value={item.notes || ''}
                    onChange={(e) => updateLineItem(item.id, 'notes', e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {lineItems.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-gray-50 px-4 py-2 rounded-md">
                <span className="text-sm font-medium">
                  Total: ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
