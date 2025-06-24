
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ExpenseCategorySelector } from '@/components/payments/bill/ExpenseCategorySelector';

export interface ContractSubLineItem {
  id: string;
  description: string;
  categoryId: string;
  budget: number;
  markup: number;
  price: number;
}

export interface ContractLineItem {
  id: string;
  description: string;
  subItems: ContractSubLineItem[];
  isExpanded?: boolean;
}

interface ContractLineItemsProps {
  lineItems: ContractLineItem[];
  onChange: (lineItems: ContractLineItem[]) => void;
  projectValue?: number;
}

export function ContractLineItems({ lineItems, onChange, projectValue }: ContractLineItemsProps) {
  const addLineItem = () => {
    const newItem: ContractLineItem = {
      id: `parent-${Date.now()}`,
      description: '',
      subItems: [],
      isExpanded: true
    };
    onChange([...lineItems, newItem]);
  };

  const addSubItem = (parentId: string) => {
    const newSubItem: ContractSubLineItem = {
      id: `sub-${Date.now()}`,
      description: '',
      categoryId: '',
      budget: 0,
      markup: 0,
      price: 0
    };
    
    const updatedItems = lineItems.map(item => 
      item.id === parentId 
        ? { ...item, subItems: [...item.subItems, newSubItem], isExpanded: true }
        : item
    );
    onChange(updatedItems);
  };

  const updateLineItem = (id: string, field: keyof ContractLineItem, value: string | boolean) => {
    const updatedItems = lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(updatedItems);
  };

  const updateSubItem = (parentId: string, subId: string, field: keyof ContractSubLineItem, value: string | number) => {
    const updatedItems = lineItems.map(item => 
      item.id === parentId 
        ? {
            ...item,
            subItems: item.subItems.map(subItem => {
              if (subItem.id === subId) {
                const updatedSubItem = { ...subItem, [field]: value };
                
                // Auto-calculate price when budget or markup changes
                if (field === 'budget' || field === 'markup') {
                  const budget = field === 'budget' ? Number(value) : updatedSubItem.budget;
                  const markup = field === 'markup' ? Number(value) : updatedSubItem.markup;
                  updatedSubItem.price = budget * (1 + markup / 100);
                }
                
                return updatedSubItem;
              }
              return subItem;
            })
          }
        : item
    );
    onChange(updatedItems);
  };

  const removeLineItem = (id: string) => {
    const updatedItems = lineItems.filter(item => item.id !== id);
    onChange(updatedItems);
  };

  const removeSubItem = (parentId: string, subId: string) => {
    const updatedItems = lineItems.map(item => 
      item.id === parentId 
        ? { ...item, subItems: item.subItems.filter(subItem => subItem.id !== subId) }
        : item
    );
    onChange(updatedItems);
  };

  const toggleExpanded = (id: string) => {
    updateLineItem(id, 'isExpanded', !lineItems.find(item => item.id === id)?.isExpanded);
  };

  const calculateParentTotals = (subItems: ContractSubLineItem[]) => {
    const totalBudget = subItems.reduce((sum, item) => sum + (item.budget || 0), 0);
    const totalPrice = subItems.reduce((sum, item) => sum + (item.price || 0), 0);
    return { totalBudget, totalPrice };
  };

  const grandTotal = lineItems.reduce((sum, item) => {
    const { totalPrice } = calculateParentTotals(item.subItems);
    return sum + totalPrice;
  }, 0);

  const difference = projectValue ? grandTotal - projectValue : 0;
  const isOverBudget = difference > 0;
  const isUnderBudget = difference < 0;

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
          Add Line Item
        </Button>
      </div>

      {lineItems.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No line items added yet. Click "Add Line Item" to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {lineItems.map((item) => {
            const { totalBudget, totalPrice } = calculateParentTotals(item.subItems);
            
            return (
              <Card key={item.id} className="p-4">
                {/* Parent Line Item Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(item.id)}
                    className="mt-6 p-1 h-6 w-6"
                  >
                    {item.isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-6">
                      <Label htmlFor={`description-${item.id}`} className="text-sm font-medium">
                        Line Item Description
                      </Label>
                      <Input
                        id={`description-${item.id}`}
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Enter line item description"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Total Budget</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                        ${totalBudget.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Total Price</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 rounded-md text-sm font-medium">
                        ${totalPrice.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSubItem(item.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
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
                </div>

                {/* Sub-items */}
                {item.isExpanded && (
                  <div className="ml-9 space-y-2">
                    {item.subItems.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2 px-3 bg-gray-50 rounded-md">
                        No sub-items. Click the + button above to add sub-items.
                      </div>
                    ) : (
                      item.subItems.map((subItem) => (
                        <div key={subItem.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-md">
                          <div className="md:col-span-3">
                            <Label htmlFor={`sub-description-${subItem.id}`} className="text-xs">
                              Description
                            </Label>
                            <Input
                              id={`sub-description-${subItem.id}`}
                              value={subItem.description}
                              onChange={(e) => updateSubItem(item.id, subItem.id, 'description', e.target.value)}
                              placeholder="Sub-item description"
                              className="mt-1 text-sm"
                              size="sm"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label htmlFor={`sub-category-${subItem.id}`} className="text-xs">
                              Category
                            </Label>
                            <div className="mt-1">
                              <ExpenseCategorySelector
                                value={subItem.categoryId}
                                onChange={(value) => updateSubItem(item.id, subItem.id, 'categoryId', value)}
                                error={!subItem.categoryId}
                              />
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label htmlFor={`sub-budget-${subItem.id}`} className="text-xs">
                              Budget
                            </Label>
                            <Input
                              id={`sub-budget-${subItem.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={subItem.budget || ''}
                              onChange={(e) => updateSubItem(item.id, subItem.id, 'budget', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="mt-1 text-sm"
                              size="sm"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label htmlFor={`sub-markup-${subItem.id}`} className="text-xs">
                              Markup %
                            </Label>
                            <Input
                              id={`sub-markup-${subItem.id}`}
                              type="number"
                              step="0.1"
                              min="0"
                              value={subItem.markup || ''}
                              onChange={(e) => updateSubItem(item.id, subItem.id, 'markup', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="mt-1 text-sm"
                              size="sm"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label className="text-xs">Price</Label>
                            <div className="mt-1 px-2 py-1 bg-white rounded text-sm font-medium">
                              ${subItem.price?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          
                          <div className="md:col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubItem(item.id, subItem.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Contract Value Comparison */}
          <Card className="p-4 bg-gray-50 border-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Contract Value Comparison</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Contract Value</div>
                  <div className="font-medium text-lg">${projectValue?.toFixed(2) || '0.00'}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Line Items Total</div>
                  <div className="font-medium text-lg">${grandTotal.toFixed(2)}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Difference</div>
                  <div className={`font-medium text-lg ${
                    isOverBudget ? 'text-red-600' : 
                    isUnderBudget ? 'text-orange-600' : 
                    'text-green-600'
                  }`}>
                    {difference > 0 ? '+' : ''}${difference.toFixed(2)}
                    {isOverBudget && ' (Over Budget)'}
                    {isUnderBudget && ' (Under Budget)'}
                    {difference === 0 && ' (Matches)'}
                  </div>
                </div>
              </div>
              
              {difference !== 0 && (
                <div className={`text-xs p-2 rounded ${
                  isOverBudget ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {isOverBudget 
                    ? 'Line items exceed the contract value. Consider adjusting pricing or project scope.'
                    : 'Line items are under the contract value. You may want to add more items or adjust pricing.'
                  }
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
