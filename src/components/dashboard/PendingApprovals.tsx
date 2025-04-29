
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface PendingApprovalsProps {
  projectId?: string | null;
}

export function PendingApprovals({ projectId }: PendingApprovalsProps) {
  const { data: bills, isLoading } = useQuery({
    queryKey: ['pending-approvals', projectId],
    queryFn: async () => {
      let query = supabase
        .from('bills')
        .select('*')
        .eq('status', 'pending');
        
      // Filter by project if specified
      if (projectId === 'unassigned') {
        query = query.is('project_id', null);
      } else if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query
        .order('due_date', { ascending: true })
        .limit(5);
        
      if (error) throw error;
      return data;
    }
  });

  const handleApprove = async (id: string) => {
    try {
      await supabase
        .from('bills')
        .update({ status: 'approved' })
        .eq('id', id);
    } catch (error) {
      console.error('Error approving bill:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase
        .from('bills')
        .update({ status: 'rejected' })
        .eq('id', id);
    } catch (error) {
      console.error('Error rejecting bill:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Pending Approvals</h2>
      
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      ) : bills && bills.length > 0 ? (
        <div className="space-y-3">
          {bills.map(bill => (
            <div key={bill.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium text-sm">{bill.bill_number}</p>
                  <p className="text-xs text-gray-500">{bill.vendor_name}</p>
                </div>
                <span className="font-medium">{formatCurrency(bill.amount)}</span>
              </div>
              <div className="flex space-x-2 justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2"
                  onClick={() => handleReject(bill.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(bill.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No pending approvals
        </div>
      )}
    </div>
  );
}
