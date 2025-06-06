
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/lib/utils";
import { toast } from 'sonner';

interface BillableItem {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  category_name: string;
  bill_number: string;
  vendor_name: string;
}

interface AddBillableItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAddItems: (items: BillableItem[]) => void;
}

export function AddBillableItemsDialog({ isOpen, onClose, projectId, onAddItems }: AddBillableItemsDialogProps) {
  const [billableItems, setBillableItems] = useState<BillableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBillableItems();
    }
  }, [isOpen, projectId]);

  const fetchBillableItems = async () => {
    setLoading(true);
    try {
      // Fetch billable line items from bills on this project that haven't been invoiced yet
      const { data, error } = await supabase
        .from('bill_line_items')
        .select(`
          *,
          expense_categories (name),
          bills!inner (
            bill_number,
            vendor_name,
            project_id
          )
        `)
        .eq('billable', true)
        .eq('invoiced', false)
        .eq('bills.project_id', projectId);

      if (error) throw error;

      const formattedItems = data.map((item: any) => ({
        id: item.id,
        description: item.description || `${item.bills.vendor_name} - Line Item`,
        amount: item.amount,
        category_id: item.category_id,
        category_name: item.expense_categories?.name || 'Uncategorized',
        bill_number: item.bills.bill_number,
        vendor_name: item.bills.vendor_name
      }));

      setBillableItems(formattedItems);
    } catch (error) {
      console.error('Error fetching billable items:', error);
      toast.error('Failed to load billable items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleAddSelected = () => {
    const itemsToAdd = billableItems.filter(item => selectedItems.has(item.id));
    onAddItems(itemsToAdd);
    setSelectedItems(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Billable Items</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-8">Loading billable items...</div>
          ) : billableItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No billable items found for this project.
            </div>
          ) : (
            <div className="space-y-2">
              {billableItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => handleItemToggle(item.id)}
                  />
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-gray-500">{item.category_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Bill #</div>
                      <div>{item.bill_number}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Vendor</div>
                      <div>{item.vendor_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.amount)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedItems.size} item(s) selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedItems.size === 0}
            >
              Add Selected Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
