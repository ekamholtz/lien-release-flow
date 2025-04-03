
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type BillApproval = {
  id: string;
  bill_number: string;
  vendor_name: string;
  amount: number;
  due_date: string;
  description?: string;
};

export function PendingApprovals() {
  const [approvals, setApprovals] = useState<BillApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bills')
          .select('id, bill_number, vendor_name, amount, due_date')
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(3);
        
        if (error) throw error;
        
        setApprovals(data || []);
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      
      setApprovals(approvals.filter(item => item.id !== id));
      toast({
        title: "Bill approved",
        description: "The bill has been approved successfully",
      });
    } catch (error) {
      console.error('Error approving bill:', error);
      toast({
        title: "Error",
        description: "Failed to approve the bill",
        variant: "destructive"
      });
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      
      setApprovals(approvals.filter(item => item.id !== id));
      toast({
        title: "Bill declined",
        description: "The bill has been declined",
      });
    } catch (error) {
      console.error('Error declining bill:', error);
      toast({
        title: "Error",
        description: "Failed to decline the bill",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pending Approvals</h3>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <p>Loading pending approvals...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No pending approvals</p>
          </div>
        ) : (
          approvals.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-construction-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-construction-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{item.bill_number}</h4>
                    <p className="text-xs text-gray-500">{item.vendor_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${item.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Due: {format(new Date(item.due_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(item.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDecline(item.id)}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
