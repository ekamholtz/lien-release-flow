
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface PendingApprovalsProps {
  projectId?: string | null;
}

export function PendingApprovals({ projectId }: PendingApprovalsProps) {
  const { currentCompany } = useCompany();
  
  const { 
    data: bills, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['pending-approvals', projectId, currentCompany?.id],
    queryFn: async () => {
      // If no current company, return empty array
      if (!currentCompany?.id) {
        return [];
      }
      
      let query = supabase
        .from('bills')
        .select('*')
        .eq('status', 'pending')
        .eq('company_id', currentCompany.id);
        
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
    },
    enabled: !!currentCompany?.id
  });

  const handleApprove = async (id: string) => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }
    
    try {
      await supabase
        .from('bills')
        .update({ status: 'approved' })
        .eq('id', id)
        .eq('company_id', currentCompany.id);
        
      toast.success("Bill approved successfully");
      refetch();
    } catch (error) {
      console.error('Error approving bill:', error);
      toast.error("Failed to approve bill");
    }
  };

  const handleReject = async (id: string) => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }
    
    try {
      await supabase
        .from('bills')
        .update({ status: 'rejected' })
        .eq('id', id)
        .eq('company_id', currentCompany.id);
        
      toast.success("Bill rejected");
      refetch();
    } catch (error) {
      console.error('Error rejecting bill:', error);
      toast.error("Failed to reject bill");
    }
  };

  if (!currentCompany?.id) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Pending Approvals</h2>
        <div className="text-center py-8 text-gray-500">
          Please select a company to view pending approvals
        </div>
      </div>
    );
  }

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
