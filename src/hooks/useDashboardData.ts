
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

interface DashboardSummary {
  totalOutstanding: number;
  totalOutstandingChange: number;
  pendingApprovals: number;
  pendingApprovalsChange: number;
  completedPayments: number;
  completedPaymentsChange: number;
  isLoading: boolean;
  error: Error | null;
}

export function useDashboardData(): DashboardSummary {
  const { currentCompany } = useCompany();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary', currentCompany?.id],
    queryFn: async (): Promise<DashboardSummary> => {
      if (!currentCompany?.id) {
        throw new Error("No company selected");
      }
      
      // Get total outstanding from unpaid invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount, status, created_at')
        .eq('company_id', currentCompany.id);
      
      if (invoicesError) throw invoicesError;
      
      // Get pending approvals count
      const { data: pendingBills, error: billsError } = await supabase
        .from('bills')
        .select('id, amount, status, created_at')
        .eq('company_id', currentCompany.id)
        .eq('status', 'pending');
      
      if (billsError) throw billsError;
      
      // Get completed payments (paid invoices and approved bills)
      const { data: paidInvoices, error: paidError } = await supabase
        .from('invoices')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('status', 'paid');
        
      if (paidError) throw paidError;
      
      const { data: approvedBills, error: approvedError } = await supabase
        .from('bills')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('status', 'approved');
        
      if (approvedError) throw approvedError;
      
      // Calculate total outstanding
      const totalOutstanding = invoices
        ?.filter(inv => inv.status !== 'paid')
        ?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
      
      // Calculate changes (mock for now, would need historical data)
      const totalOutstandingChange = 12.5; // This would be calculated based on historical data
      const pendingApprovalsChange = 3.2; // This would be calculated based on historical data
      const completedPaymentsChange = 8.1; // This would be calculated based on historical data
      
      return {
        totalOutstanding,
        totalOutstandingChange,
        pendingApprovals: pendingBills?.length || 0,
        pendingApprovalsChange,
        completedPayments: (paidInvoices?.length || 0) + (approvedBills?.length || 0),
        completedPaymentsChange,
        isLoading: false,
        error: null
      };
    },
    enabled: !!currentCompany?.id
  });
  
  return {
    totalOutstanding: data?.totalOutstanding || 0,
    totalOutstandingChange: data?.totalOutstandingChange || 0,
    pendingApprovals: data?.pendingApprovals || 0,
    pendingApprovalsChange: data?.pendingApprovalsChange || 0,
    completedPayments: data?.completedPayments || 0,
    completedPaymentsChange: data?.completedPaymentsChange || 0,
    isLoading,
    error: error as Error | null
  };
}
