
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { BillsTable } from '@/components/payments/BillsTable';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject, DbInvoice, DbBill, InvoiceStatus, BillStatus } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface ProjectTransactionsProps {
  project: DbProject;
}

// Define extended invoice type that includes the project name from the join
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
};

// Define extended bill type that includes the project name from the join
type ExtendedBill = DbBill & {
  projects?: { 
    name: string;
  };
};

export function ProjectTransactions({ project }: ProjectTransactionsProps) {
  const { currentCompany } = useCompany();
  
  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['project-invoices', project.id, currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data } = await supabase
        .from('invoices')
        .select('*, projects(name)')
        .eq('project_id', project.id)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });
        
      // Cast the status to ensure it matches InvoiceStatus type and add type assertion for ExtendedInvoice[]
      return (data || []).map(invoice => ({
        ...invoice,
        status: invoice.status as InvoiceStatus
      })) as unknown as ExtendedInvoice[];
    },
    enabled: !!currentCompany?.id && !!project.id
  });

  const { data: bills = [], refetch: refetchBills } = useQuery({
    queryKey: ['project-bills', project.id, currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data } = await supabase
        .from('bills')
        .select('*, projects(name)')
        .eq('project_id', project.id)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });
        
      // Cast the status to ensure it matches BillStatus type and add type assertion for ExtendedBill[]
      return (data || []).map(bill => ({
        ...bill,
        status: bill.status as BillStatus
      })) as unknown as ExtendedBill[];
    },
    enabled: !!currentCompany?.id && !!project.id
  });

  // Handler for updating invoice status
  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    if (!currentCompany?.id) {
      toast.error("Please select a company first");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)
        .eq('company_id', currentCompany.id);
      
      if (error) throw error;
      
      await refetchInvoices();
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  // Handler for updating bill status
  const handleUpdateBillStatus = async (billId: string, newStatus: BillStatus) => {
    if (!currentCompany?.id) {
      toast.error("Please select a company first");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: newStatus })
        .eq('id', billId)
        .eq('company_id', currentCompany.id);
      
      if (error) throw error;
      
      await refetchBills();
      toast.success(`Bill status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating bill status:', error);
      toast.error('Failed to update bill status');
    }
  };

  // Placeholder handlers
  const handlePayInvoice = (invoice: ExtendedInvoice) => {
    console.log('Pay invoice', invoice);
    // Implement payment logic here
  };

  const handleViewInvoiceDetails = (invoice: ExtendedInvoice) => {
    console.log('View invoice details', invoice);
    // Implement view details logic here
  };

  const handlePayBill = (bill: ExtendedBill) => {
    console.log('Pay bill', bill);
    // Implement payment logic here
  };

  const handleViewBillDetails = (bill: ExtendedBill) => {
    console.log('View bill details', bill);
    // Implement view details logic here
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Transactions</h2>
      
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="bills">Bills ({bills.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="mt-4">
          <InvoicesTable 
            invoices={invoices} 
            onUpdateStatus={handleUpdateInvoiceStatus} 
            onPayInvoice={handlePayInvoice}
            onViewDetails={handleViewInvoiceDetails}
          />
        </TabsContent>
        
        <TabsContent value="bills" className="mt-4">
          <BillsTable 
            bills={bills}
            onUpdateStatus={handleUpdateBillStatus}
            onPayBill={handlePayBill}
            onViewDetails={handleViewBillDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
