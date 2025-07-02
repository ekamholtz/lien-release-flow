
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { FinanceFiltersState } from '@/components/finance/FinanceFilters';
import { useCompany } from '@/contexts/CompanyContext';

// Define an extended invoice type that includes the project name from the join
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
};

export function useAccountsReceivable() {
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState<FinanceFiltersState>({
    projectId: null,
    dateRange: null,
    projectManagerId: null
  });
  const { currentCompany } = useCompany();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // If no company is selected, don't fetch any data
      if (!currentCompany?.id) {
        setInvoices([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching invoices for company:', currentCompany.id);
      
      // Always filter by company_id first
      let query = supabase
        .from('invoices')
        .select('*, projects(name)')
        .eq('company_id', currentCompany.id);
      
      // Apply project filter if selected
      if (filters.projectId === 'unassigned') {
        query = query.is('project_id', null);
      } else if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      
      // Apply project manager filter if specified
      if (filters.projectManagerId) {
        query = query.eq('project_manager_id', filters.projectManagerId);
      }
      
      // Apply date range filter if specified
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Fetched invoices:', data?.length || 0);
      setInvoices(data as ExtendedInvoice[] || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters, currentCompany?.id]);

  const handleUpdateStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    if (!currentCompany?.id) {
      toast({
        title: "No Company Selected",
        description: "Please select a company first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)
        .eq('company_id', currentCompany.id);
        
      if (error) throw error;
      
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus } 
          : invoice
      ));
      
      toast({
        title: `Invoice ${newStatus}`,
        description: `The invoice status has been updated to ${newStatus}`,
      });
    } catch (error) {
      console.error(`Error updating invoice status to ${newStatus}:`, error);
      toast({
        title: "Error",
        description: `Failed to update invoice status`,
        variant: "destructive"
      });
    }
  };
  
  const handlePayInvoice = (invoice: ExtendedInvoice) => {
    if (!currentCompany?.id) {
      toast({
        title: "No Company Selected",
        description: "Please select a company first",
        variant: "destructive"
      });
      return;
    }
    
    console.log('handlePayInvoice called with:', invoice);
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
    setIsDetailsModalOpen(false); // Ensure details modal is closed
  };
  
  const handleViewDetails = (invoice: ExtendedInvoice) => {
    console.log('handleViewDetails called with:', invoice);
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
    setIsPaymentDialogOpen(false); // Ensure payment dialog is closed
  };

  const handleFilterChange = (newFilters: FinanceFiltersState) => {
    setFilters(newFilters);
  };

  const handlePaymentDialogClose = () => {
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDetailsModalClose = () => {
    console.log('handleDetailsModalClose called');
    setIsDetailsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePaymentComplete = async () => {
    console.log('Payment completed, refreshing invoices list...');
    
    // Close dialogs immediately
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
    
    // Add a small delay before refreshing to allow database updates to propagate
    setTimeout(async () => {
      await fetchInvoices();
      
      toast({
        title: "Payment Recorded",
        description: "The payment has been successfully recorded and the invoice status has been updated.",
      });
    }, 1000);
  };

  return {
    invoices,
    loading,
    selectedInvoice,
    isPaymentDialogOpen,
    isDetailsModalOpen,
    filters,
    currentCompany,
    handleUpdateStatus,
    handlePayInvoice,
    handleViewDetails,
    handleFilterChange,
    handlePaymentDialogClose,
    handleDetailsModalClose,
    handlePaymentComplete,
    fetchInvoices
  };
}
