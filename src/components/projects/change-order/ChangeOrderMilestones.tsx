
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Milestone {
  id?: string;
  name: string;
  percentage: number;
  amount: number;
  description?: string;
  status: 'pending' | 'completed';
}

// Interface for database milestone which might have a string status
interface DbMilestone extends Omit<Milestone, 'status'> {
  status: string;
  is_completed?: boolean;
  company_id?: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  due_date?: string;
  due_type?: string;
  invoice_id?: string;
}

interface ChangeOrderMilestonesProps {
  initialData: any;
  updateFormData: (data: any) => void;
  projectId?: string;
}

const ChangeOrderMilestones = ({ initialData, updateFormData, projectId }: ChangeOrderMilestonesProps) => {
  // Use refs to prevent infinite loops
  const initialRenderDone = useRef(false);
  const userChanging = useRef(false);
  const lastSubmittedData = useRef<{ milestones: Milestone[], amount: number } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [originalProjectValue, setOriginalProjectValue] = useState(0);
  const [changeOrderAmount, setChangeOrderAmount] = useState(initialData?.amount || 0);
  const [pendingMilestones, setPendingMilestones] = useState<Milestone[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<Milestone[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  
  // Total project value (original + change order)
  const totalProjectValue = originalProjectValue + changeOrderAmount;

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
        
        setOriginalProjectValue(project.value);
        
        // Convert DB milestones to the expected format
        const validMilestones = (milestones || []).map((m: DbMilestone): Milestone => ({
          id: m.id,
          name: m.name,
          percentage: m.percentage,
          amount: m.amount,
          description: m.description,
          status: m.status === 'completed' ? 'completed' : 'pending'
        }));
        
        // Separate completed and pending milestones
        const completed = validMilestones.filter(m => m.status === 'completed');
        const pending = validMilestones.filter(m => m.status === 'pending');
        
        setCompletedMilestones(completed);
        
        // Initialize milestones from form data or database
        if (initialData?.milestones?.length > 0) {
          setPendingMilestones(initialData.milestones);
        } else {
          setPendingMilestones(pending);
        }
        
        // Set change order amount from initialData if it exists
        if (initialData?.amount) {
          setChangeOrderAmount(initialData.amount);
        }
      } catch (error) {
        console.error('Error loading milestones:', error);
        toast.error('Failed to load project milestones');
      } finally {
        setIsLoading(false);
        // Mark initial render as complete
        initialRenderDone.current = true;
      }
    };
    
    loadData();
  }, [projectId]); // Only depends on projectId
  
  // Calculate total percentage whenever milestones change or change order amount changes
  useEffect(() => {
    // When change order amount changes, we need to recalculate percentages based on new total
    if (changeOrderAmount > 0 && totalProjectValue > 0) {
      // Calculate the total amount from all milestones
      const completedAmount = completedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      const pendingAmount = pendingMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      const totalAmount = completedAmount + pendingAmount;
      
      // Calculate percentage based on the new total project value
      const calculatedPercentage = (totalAmount / totalProjectValue) * 100;
      setTotalPercentage(parseFloat(calculatedPercentage.toFixed(2)));
    } else {
      // If no change order amount, calculate percentage normally
      const completedPercentage = completedMilestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
      const pendingPercentage = pendingMilestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
      setTotalPercentage(completedPercentage + pendingPercentage);
    }
  }, [pendingMilestones, completedMilestones, changeOrderAmount, totalProjectValue]);
  
  // Update parent form data, but only when:
  // 1. We're not in the initial render
  // 2. This isn't triggered by a user currently changing something
  // 3. The data has actually changed from what we last sent
  useEffect(() => {
    const newData = {
      milestones: pendingMilestones,
      amount: changeOrderAmount
    };
    
    const lastData = lastSubmittedData.current;
    const dataChanged = !lastData || 
                        lastData.amount !== newData.amount || 
                        JSON.stringify(lastData.milestones) !== JSON.stringify(newData.milestones);
    
    if (initialRenderDone.current && !userChanging.current && dataChanged) {
      lastSubmittedData.current = newData;
      updateFormData(newData);
    }
  }, [pendingMilestones, changeOrderAmount, updateFormData]);

  // Handle change order amount change
  const handleChangeOrderAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    userChanging.current = true;
    const newAmount = parseFloat(e.target.value) || 0;
    setChangeOrderAmount(newAmount);
    
    // Calculate the new total project value
    const newTotalValue = originalProjectValue + newAmount;
    
    // Recalculate milestone amounts based on the new total
    const updatedMilestones = pendingMilestones.map(milestone => {
      // Maintain the same percentage but update the amount
      const calculatedAmount = (milestone.percentage / 100) * newTotalValue;
      return {
        ...milestone,
        amount: parseFloat(calculatedAmount.toFixed(2))
      };
    });
    
    setPendingMilestones(updatedMilestones);
    
    // Reset the user flag after update
    setTimeout(() => {
      userChanging.current = false;
    }, 0);
  };

  // Add a new milestone
  const addMilestone = () => {
    userChanging.current = true;
    
    const newMilestone: Milestone = {
      name: '',
      percentage: 0,
      amount: 0,
      status: 'pending',
      description: ''
    };
    
    setPendingMilestones([...pendingMilestones, newMilestone]);
    
    setTimeout(() => {
      userChanging.current = false;
    }, 0);
  };

  // Remove a milestone
  const removeMilestone = (index: number) => {
    userChanging.current = true;
    
    setPendingMilestones(pendingMilestones.filter((_, i) => i !== index));
    
    setTimeout(() => {
      userChanging.current = false;
    }, 0);
  };

  // Update a milestone field
  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    userChanging.current = true;
    
    const updatedMilestones = [...pendingMilestones];
    const updatedMilestone = { ...updatedMilestones[index] };
    
    // Handle the update based on which field changed
    if (field === 'percentage') {
      // Update percentage directly
      const newPercentage = parseFloat(value) || 0;
      updatedMilestone.percentage = newPercentage;
      
      // Calculate the corresponding amount based on total project value
      const newAmount = (newPercentage / 100) * totalProjectValue;
      updatedMilestone.amount = parseFloat(newAmount.toFixed(2));
    } 
    else if (field === 'amount') {
      // Update amount directly
      const newAmount = parseFloat(value) || 0;
      updatedMilestone.amount = newAmount;
      
      // Calculate the corresponding percentage based on total project value
      const newPercentage = totalProjectValue > 0 ? ((newAmount / totalProjectValue) * 100) : 0;
      updatedMilestone.percentage = parseFloat(newPercentage.toFixed(2));
    }
    else {
      // For other fields, just update the value
      updatedMilestone[field] = value;
    }
    
    // Update the milestone in the array
    updatedMilestones[index] = updatedMilestone;

    // Update state
    setPendingMilestones(updatedMilestones);

    // Reset the flag after update
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Original Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(originalProjectValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Change Order</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={changeOrderAmount}
              onChange={handleChangeOrderAmountChange}
              placeholder="Enter change order amount"
              className="mb-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Total Value</CardTitle>
          </CardHeader>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label>Name</Label>
                      <p className="font-medium">{milestone.name}</p>
                    </div>
                    <div>
                      <Label>Percentage</Label>
                      <p className="font-medium">{milestone.percentage}%</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                        placeholder="Milestone name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`percentage-${index}`}>Percentage (%)</Label>
                      <Input
                        id={`percentage-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={milestone.percentage}
                        onChange={(e) => updateMilestone(index, 'percentage', e.target.value)}
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
      
      {/* Total Percentage */}
      <Card className={totalPercentage !== 100 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Total Percentage</h3>
              <p className="text-sm text-muted-foreground">
                The total percentage across all milestones must equal 100%
            </p>
          </div>
          <div className="text-xl font-bold">
            {totalPercentage.toFixed(2)}%
          </div>
        </div>
        
        {!isLoading && Math.abs(totalPercentage - 100) > 0.01 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-yellow-800">
              <strong>Warning:</strong> Total milestone percentage is {totalPercentage.toFixed(2)}%. 
              It should be exactly 100%.
            </p>
          </div>
        )}
        
        {totalPercentage !== 100 && (
          <p className="text-red-600 text-sm mt-2">
            {totalPercentage < 100 
              ? `You need to add ${(100 - totalPercentage).toFixed(2)}% more to reach 100%`
              : `You are ${(totalPercentage - 100).toFixed(2)}% over 100%`}
          </p>
        )}
      </CardContent>
    </Card>
  </div>
);
};

export default ChangeOrderMilestones;
