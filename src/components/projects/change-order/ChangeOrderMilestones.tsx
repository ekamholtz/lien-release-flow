import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Define the Milestone interface
interface Milestone {
  id?: string;
  name: string;
  percentage?: number;
  amount: number;
  description?: string;
  status: 'pending' | 'completed';
}

// Define ChangeOrderFormData interface
interface ChangeOrderFormData {
  description: string;
  amount: number;
  milestones: Milestone[];
}

// Helper function for consistent currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

interface ChangeOrderMilestonesProps {
  formData: ChangeOrderFormData;
  updateFormData: (data: Partial<ChangeOrderFormData>) => void;
  projectId: string;
  changeOrderAmount: number;
  originalProjectValue: number;
}

const ChangeOrderMilestones: React.FC<ChangeOrderMilestonesProps> = ({
  formData,
  updateFormData,
  projectId,
  changeOrderAmount,
  originalProjectValue,
}) => {
  // Use refs to prevent infinite loops
  const initialRenderDone = useRef(false);
  const userChanging = useRef(false);
  const lastSubmittedData = useRef<{ milestones: Milestone[], amount: number } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMilestones, setPendingMilestones] = useState<Milestone[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<Milestone[]>([]);
  
  // Calculate the total project value (original + change order)
  // Ensure both values are treated as numbers
  const numericOriginalValue = Number(originalProjectValue) || 0;
  const numericChangeAmount = Number(changeOrderAmount) || 0;
  const totalProjectValue = numericOriginalValue + numericChangeAmount;
  
  // Debug output to console
  useEffect(() => {
    console.log('ChangeOrderMilestones values:', {
      originalProjectValue,
      changeOrderAmount,
      numericOriginalValue,
      numericChangeAmount,
      totalProjectValue
    });
  }, [originalProjectValue, changeOrderAmount, numericOriginalValue, numericChangeAmount, totalProjectValue]);
  
  // Load project data and milestones once
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      
      try {
        // Get project value
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('value')
          .eq('id', projectId)
          .single();
          
        if (projectError) throw projectError;
        
        // Get milestones
        const { data: milestones, error: milestonesError } = await supabase
          .from('milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });
          
        if (milestonesError) throw milestonesError;
        
        // Convert DB milestones to the expected format
        const validMilestones = (milestones || []).map((m: any): Milestone => ({
          id: m.id,
          name: m.name,
          amount: m.amount,
          description: m.description,
          status: m.status === 'completed' ? 'completed' : 'pending'
        }));
        
        // Separate completed and pending milestones
        const completed = validMilestones.filter(m => m.status === 'completed');
        const pending = validMilestones.filter(m => m.status === 'pending');
        
        setCompletedMilestones(completed);
        
        // Initialize milestones from form data or database
        if (formData?.milestones?.length > 0) {
          setPendingMilestones(formData.milestones);
        } else {
          setPendingMilestones(pending);
        }
      } catch (error) {
        console.error('Error loading milestones:', error);
      } finally {
        setIsLoading(false);
        // Mark initial render as complete
        initialRenderDone.current = true;
      }
    };
    
    loadData();
  }, [projectId]); // Only depends on projectId
  

  
  // Helper function to get the total milestone amount - ensures numeric addition
  const getTotalMilestoneAmount = (): number => {
    // Calculate completed milestones total (with explicit number conversion)
    const completedAmount = completedMilestones.reduce((sum, m) => {
      const amount = typeof m.amount === 'number' ? m.amount : Number(m.amount) || 0;
      return sum + amount;
    }, 0);
    
    // Calculate pending milestones total (with explicit number conversion)
    const pendingAmount = pendingMilestones.reduce((sum, m) => {
      const amount = typeof m.amount === 'number' ? m.amount : Number(m.amount) || 0;
      return sum + amount;
    }, 0);
    
    // Return the sum as a number
    return Number(completedAmount) + Number(pendingAmount);
  };

  // Update parent form data, but only when:
  // 1. Initial render is done
  // 2. User has made changes or we have not yet submitted these milestones
  // 3. Current pending milestones don't match what we last submitted
  useEffect(() => {
    if (!initialRenderDone.current) return;
    
    const currentData = { milestones: pendingMilestones, amount: changeOrderAmount };
    const previousData = lastSubmittedData.current;
    
    const dataChanged = userChanging.current || 
      !previousData || 
      JSON.stringify(previousData.milestones) !== JSON.stringify(currentData.milestones) ||
      previousData.amount !== currentData.amount;
      
    if (dataChanged) {
      lastSubmittedData.current = { ...currentData };
      userChanging.current = false;
      
      // Calculate the percentage based on amount if not provided
      const milestonesWithPercentage = pendingMilestones.map(m => {
        if (totalProjectValue > 0) {
          return {
            ...m,
            percentage: Number(((Number(m.amount) / totalProjectValue) * 100).toFixed(2))
          };
        }
        return m;
      });
      
      // Update the parent form data with both pending and completed milestones
      // This ensures completed milestones are included in total calculations
      updateFormData({
        milestones: [...completedMilestones, ...milestonesWithPercentage]
      });
      
      console.log('Updated parent form data with all milestones:', {
        completed: completedMilestones.length, 
        pending: milestonesWithPercentage.length, 
        total: completedMilestones.length + milestonesWithPercentage.length
      });
    }
  }, [pendingMilestones, completedMilestones, changeOrderAmount, updateFormData, totalProjectValue]);

  // Add a new milestone
  const addMilestone = () => {
    userChanging.current = true;
    
    const newMilestone: Milestone = {
      name: '',
      amount: 0,
      percentage: 0,
      status: 'pending',
      description: ''
    };
    
    const updatedMilestones = [...pendingMilestones, newMilestone];
    setPendingMilestones(updatedMilestones);
    
    // Directly update the parent's formData with the new milestones
    updateFormData({
      milestones: updatedMilestones
    });
    
    // Reset the user flag after update
    setTimeout(() => {
      userChanging.current = false;
    }, 0);
  };

  // Remove a milestone
  const removeMilestone = (index: number) => {
    userChanging.current = true;
    
    const updatedMilestones = [...pendingMilestones];
    updatedMilestones.splice(index, 1);
    
    setPendingMilestones(updatedMilestones);
    
    // Immediately update parent form data
    updateFormData({
      milestones: updatedMilestones
    });
  };

  // Update a milestone field
  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    userChanging.current = true;
    
    const updatedMilestones = [...pendingMilestones];
    const updatedMilestone = { ...updatedMilestones[index] };
    
    // Handle the update based on which field changed
    if (field === 'amount') {
      // Ensure amount is always stored as a number
      const numericValue = typeof value === 'string' ? value.replace(/[^0-9.]/g, '') : value;
      updatedMilestone.amount = Number(numericValue) || 0;
      
      // If we have a percentage field, update it based on the new amount
      if (totalProjectValue > 0) {
        const newPercentage = (updatedMilestone.amount / totalProjectValue) * 100;
        updatedMilestone.percentage = Number(newPercentage.toFixed(2));
      }
    } else {
      // For other fields (like name or description), just update the value
      (updatedMilestone[field] as any) = value;
    }
    
    updatedMilestones[index] = updatedMilestone;
    setPendingMilestones(updatedMilestones);
    
    // Immediately update parent form data (debounce this for text fields like name/description)
    if (field === 'amount') {
      updateFormData({
        milestones: updatedMilestones
      });
    } else {
      // For other fields, use a short timeout to avoid excessive updates
      setTimeout(() => {
        if (!userChanging.current) return; // Only update if user is still changing
        updateFormData({
          milestones: updatedMilestones
        });
      }, 300);
    }
    
    // Reset the user flag after update
    setTimeout(() => {
      userChanging.current = false;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Milestones</h3>
        <p className="text-sm text-muted-foreground">
          Update project milestones for this change order. The total value is now {formatCurrency(totalProjectValue)}.
        </p>
      </div>

      {/* Project Value and Change Order Amount */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(originalProjectValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(changeOrderAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalProjectValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Milestones */}
      {completedMilestones.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Completed Milestones</h4>
          <div className="space-y-4">
            {completedMilestones.map((milestone, index) => (
              <Card key={`completed-${index}`} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                      <Label>Name</Label>
                      <p className="font-medium">{milestone.name}</p>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <p className="font-medium">{formatCurrency(milestone.amount)}</p>
                    </div>
                  </div>

                  {milestone.description && (
                    <div className="mt-4">
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Milestones */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Pending Milestones</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={addMilestone}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Milestone
          </Button>
        </div>

        {pendingMilestones.length === 0 ? (
          <p className="text-muted-foreground italic">No pending milestones. Click "Add Milestone" to create one.</p>
        ) : (
          <div className="space-y-4">
            {pendingMilestones.map((milestone, index) => (
              <Card key={`pending-${index}`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                        placeholder="Milestone name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`amount-${index}`}>Amount ($)</Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={milestone.description || ''}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      placeholder="Describe this milestone"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Total Coverage */}
      <Card className={Math.abs(totalProjectValue - getTotalMilestoneAmount()) > 0.01 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Total Coverage</h3>
              <p className="text-sm text-muted-foreground">
                The total value of all milestones must equal the total contract value ({formatCurrency(totalProjectValue)})
              </p>
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(getTotalMilestoneAmount())}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <div>Original Contract Value:</div>
            <div>{formatCurrency(originalProjectValue)}</div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div>Change Order Amount:</div>
            <div>{formatCurrency(changeOrderAmount)}</div>
          </div>
          <div className="flex justify-between items-center font-medium">
            <div>Total Contract Value:</div>
            <div>{formatCurrency(totalProjectValue)}</div>
          </div>
          
          {!isLoading && Math.abs(totalProjectValue - getTotalMilestoneAmount()) > 0.01 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mt-4">
              <p className="text-yellow-800">
                <strong>Warning:</strong> Total milestone amount is {formatCurrency(getTotalMilestoneAmount())}. 
                It should equal the total contract value of {formatCurrency(totalProjectValue)}.
              </p>
            </div>
          )}
          
          {Math.abs(totalProjectValue - getTotalMilestoneAmount()) > 0.01 && (
            <p className="text-red-600 text-sm mt-2">
              {totalProjectValue < getTotalMilestoneAmount() 
                ? `You need to remove ${formatCurrency(getTotalMilestoneAmount() - totalProjectValue)} to reach the total contract value`
                : `You need to add ${formatCurrency(totalProjectValue - getTotalMilestoneAmount())} more to reach the total contract value`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeOrderMilestones;
