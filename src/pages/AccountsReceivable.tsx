
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { PayInvoice } from '@/components/payments/PayInvoice';
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { InvoiceDetailsModal } from '@/components/payments/InvoiceDetailsModal';
import { FinanceFilters } from '@/components/finance/FinanceFilters';
import { useCompany } from '@/contexts/CompanyContext';

// Define an extended invoice type that includes the project name from the join
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
};

const AccountsReceivable = () => {
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
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
      
      // Always filter by company_id first
      let query = supabase
        .from('invoices')
        .select('*, projects(name)')
        .eq('company_id', currentCompany.id);
      
      // Apply project filter if selected
      if (selectedProjectId === 'unassigned') {
        query = query.is('project_id', null);
      } else if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Invoices data:', data);
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
  }, [selectedProjectId, currentCompany?.id]);

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
    
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };
  
  const handleViewDetails = (invoice: ExtendedInvoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Accounts Receivable</h1>
          <div className="ml-auto">
            <Button 
              onClick={() => navigate('/invoices/create')}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Invoice</span>
            </Button>
          </div>
        </div>
        
        <FinanceFilters 
          onFilterChange={setSelectedProjectId}
          selectedProjectId={selectedProjectId}
        />
        
        <div className="dashboard-card mb-6">
          <h2 className="text-lg font-semibold mb-4">Invoices</h2>
          
          {!currentCompany ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>Please select a company to view invoices.</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>No invoices to display. Use the "New Invoice" button to create one.</p>
            </div>
          ) : (
            <InvoicesTable 
              invoices={invoices} 
              onUpdateStatus={handleUpdateStatus} 
              onPayInvoice={handlePayInvoice}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>
      </div>
      
      {selectedInvoice && (
        <>
          <PayInvoice
            invoice={selectedInvoice}
            isOpen={isPaymentDialogOpen}
            onClose={() => setIsPaymentDialogOpen(false)}
            onPaymentComplete={() => {
              fetchInvoices();
              setSelectedInvoice(null);
            }}
          />
          
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        </>
      )}
    </AppLayout>
  );
};

export default AccountsReceivable;
