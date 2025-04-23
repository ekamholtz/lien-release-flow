
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { BillsTable } from '@/components/payments/BillsTable';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject, DbInvoice, DbBill, InvoiceStatus, BillStatus } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['project-invoices', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, projects(name)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
        
      // Cast the status to ensure it matches InvoiceStatus type
      return (data || []).map(invoice => ({
        ...invoice,
        status: invoice.status as InvoiceStatus
      })) as ExtendedInvoice[];
    }
  });

  const { data: bills = [], refetch: refetchBills } = useQuery({
    queryKey: ['project-bills', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bills')
        .select('*, projects(name)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
        
      // Cast the status to ensure it matches BillStatus type
      return (data || []).map(bill => ({
        ...bill,
        status: bill.status as BillStatus
      })) as ExtendedBill[];
    }
  });

  // Handler for updating invoice status
  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);
      
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
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: newStatus })
        .eq('id', billId);
      
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
