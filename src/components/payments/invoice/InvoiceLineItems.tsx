
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { InvoiceLineItemRow } from './InvoiceLineItemRow';
import { InvoiceLineItemsTotal } from './InvoiceLineItemsTotal';
import { AddBillableItemsDialog } from './AddBillableItemsDialog';

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

interface InvoiceLineItemsProps {
  lineItems: InvoiceLineItem[];
  onLineItemsChange: (items: InvoiceLineItem[]) => void;
  projectId?: string;
}

export function InvoiceLineItems({ lineItems, onLineItemsChange, projectId }: InvoiceLineItemsProps) {
  const [showAddBillableDialog, setShowAddBillableDialog] = React.useState(false);

  const addNewLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `temp-${Date.now()}`,
      category_id: '',
      description: '',
      cost: 0,
      markup_percentage: 0,
      price: 0,
      pricing_method: 'manual'
    };
    onLineItemsChange([...lineItems, newItem]);
  };

  const updateLineItem = (index: number, updatedItem: InvoiceLineItem) => {
    const newItems = [...lineItems];
    newItems[index] = updatedItem;
    onLineItemsChange(newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    onLineItemsChange(newItems);
  };

  const addBillableItems = (billableItems: any[]) => {
    const newLineItems = billableItems.map(item => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      category_id: item.category_id || '',
      description: item.description || '',
      cost: Number(item.amount),
      markup_percentage: 0,
      price: Number(item.amount),
      pricing_method: 'cost_plus_markup' as const,
      source_bill_line_item_id: item.id
    }));
    onLineItemsChange([...lineItems, ...newLineItems]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Line Items</h3>
        <div className="flex gap-2">
          {projectId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddBillableDialog(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import Billable Items
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNewLineItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Line Item
          </Button>
        </div>
      </div>

      {lineItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No line items added yet.</p>
          <p className="text-sm">Click "Add Line Item" to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 items-center p-3 border-b bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-2">Category</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Cost</div>
            <div className="col-span-2">Markup %</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Actions</div>
          </div>
          
          {lineItems.map((item, index) => (
            <InvoiceLineItemRow
              key={item.id}
              lineItem={item}
              onUpdate={(updatedItem) => updateLineItem(index, updatedItem)}
              onRemove={() => removeLineItem(index)}
            />
          ))}
          <InvoiceLineItemsTotal lineItems={lineItems} />
        </div>
      )}

      {projectId && (
        <AddBillableItemsDialog
          isOpen={showAddBillableDialog}
          onClose={() => setShowAddBillableDialog(false)}
          projectId={projectId}
          onAddItems={addBillableItems}
        />
      )}
    </div>
  );
}
