
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { PayInvoice } from '@/components/payments/PayInvoice';
import { InvoiceDetailsModal } from '@/components/payments/InvoiceDetailsModal';
import { Database } from '@/integrations/supabase/types';

// Define sync_status as a string union to match the database type
type sync_status = 'pending' | 'processing' | 'success' | 'error';

type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
  accounting_sync?: {
    status: sync_status;
    error: { message: string } | null;
    retries: number;
    last_synced_at: string | null;
  } | null;
};

const AccountsReceivable = () => {
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // First get all invoices with their project information
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          projects(name)
        `)
        .order('created_at', { ascending: false });
      
      if (invoicesError) {
        throw invoicesError;
      }
      
      // Then get all accounting sync records for invoices
      const { data: syncData, error: syncError } = await supabase
        .from('accounting_sync')
        .select('*')
        .eq('entity_type', 'invoice')
        .eq('provider', 'qbo');
        
      if (syncError) {
        throw syncError;
      }
      
      // Combine the data
      const combinedData = invoicesData.map(invoice => {
        const syncRecord = syncData?.find(sync => sync.entity_id === invoice.id);
        return {
          ...invoice,
          accounting_sync: syncRecord ? {
            status: syncRecord.status as sync_status,
            error: syncRecord.error ? 
              // Handle error format conversion
              (typeof syncRecord.error === 'object' && syncRecord.error !== null) ? 
                { message: (syncRecord.error as any)?.message || JSON.stringify(syncRecord.error) } : 
                { message: String(syncRecord.error) }
              : null,
            retries: syncRecord.retries || 0,
            last_synced_at: syncRecord.last_synced_at
          } : null
        };
      });
      
      console.log('Invoices data with sync status:', combinedData);
      setInvoices(combinedData as ExtendedInvoice[]);
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
  }, []);

  const handleUpdateStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);
        
      if (error) throw error;
      
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus } 
          : invoice
      ));
      
      toast({
        title: `Invoice ${newStatus === 'sent' ? 'sent' : 'updated'}`,
        description: newStatus === 'sent' 
          ? `The invoice has been sent to the client`
          : `The invoice status has been updated`,
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
              onClick={() => navigate('/create-invoice')}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Invoice</span>
            </Button>
          </div>
        </div>
        
        <div className="dashboard-card mb-6">
          <h2 className="text-lg font-semibold mb-4">Invoices</h2>
          
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>No invoices to display. Use the "New Invoice" button to create an invoice.</p>
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
