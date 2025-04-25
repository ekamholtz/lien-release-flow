
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useQboConnection } from '@/hooks/useQboConnection';

// Define sync_status as a string union to match the database type
type sync_status = 'pending' | 'processing' | 'success' | 'error';

type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
  accounting_sync?: {
    status: sync_status;
    error: { message: string; type?: string } | null;
    error_message: string | null;
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
  const [syncErrors, setSyncErrors] = useState<{
    tokenExpired: boolean;
    customerErrors: number;
    connectivityIssues: number;
  }>({
    tokenExpired: false,
    customerErrors: 0,
    connectivityIssues: 0
  });
  const [isRetrySyncing, setIsRetrySyncing] = useState(false);
  const navigate = useNavigate();
  const { qboStatus, handleConnectQbo } = useQboConnection();

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
                syncRecord.error as { message: string; type?: string } : 
                { message: String(syncRecord.error) }
              : null,
            error_message: syncRecord.error_message,
            retries: syncRecord.retries || 0,
            last_synced_at: syncRecord.last_synced_at
          } : null
        };
      });
      
      console.log('Invoices data with sync status:', combinedData);
      setInvoices(combinedData as ExtendedInvoice[]);
      
      // Analyze errors to show appropriate UI messages
      const errors = {
        tokenExpired: false,
        customerErrors: 0,
        connectivityIssues: 0
      };
      
      combinedData.forEach(invoice => {
        if (invoice.accounting_sync?.status === 'error') {
          const errorType = invoice.accounting_sync.error?.type || 
            (invoice.accounting_sync.error_message?.includes('token') || invoice.accounting_sync.error_message?.includes('auth') 
              ? 'token-expired' 
              : invoice.accounting_sync.error_message?.includes('customer') 
                ? 'customer-error'
                : invoice.accounting_sync.error_message?.includes('connect') || invoice.accounting_sync.error_message?.includes('network')
                  ? 'connectivity'
                  : 'unknown');
          
          if (errorType === 'token-expired') errors.tokenExpired = true;
          else if (errorType === 'customer-error') errors.customerErrors++;
          else if (errorType === 'connectivity') errors.connectivityIssues++;
        }
      });
      
      setSyncErrors(errors);
      
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

  const handleRetrySync = async (invoiceId: string) => {
    try {
      setIsRetrySyncing(true);
      const response = await fetch('https://oknofqytitpxmlprvekn.functions.supabase.co/sync-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoice_id: invoiceId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry sync');
      }
      
      toast({
        title: "Sync started",
        description: "Invoice sync has been restarted. This may take a moment.",
      });
      
      // Wait a moment to allow sync to complete or progress
      setTimeout(() => {
        fetchInvoices();
        setIsRetrySyncing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error retrying sync:', error);
      toast({
        title: "Sync error",
        description: error.message || "Failed to retry invoice sync",
        variant: "destructive"
      });
      setIsRetrySyncing(false);
    }
  };
  
  const handleRetryAllFailedSyncs = async () => {
    try {
      setIsRetrySyncing(true);
      
      // Get all failed invoice IDs
      const failedInvoices = invoices
        .filter(invoice => invoice.accounting_sync?.status === 'error')
        .map(invoice => invoice.id);
      
      if (failedInvoices.length === 0) {
        toast({
          title: "No failed syncs",
          description: "There are no failed syncs to retry.",
        });
        setIsRetrySyncing(false);
        return;
      }
      
      // Reset sync status to pending for all failed invoices
      for (const invoiceId of failedInvoices) {
        await supabase.rpc('update_sync_status', {
          p_entity_type: 'invoice',
          p_entity_id: invoiceId,
          p_provider: 'qbo',
          p_status: 'pending',
          p_error: null,
          p_error_message: null
        });
      }
      
      // Trigger sync for the first invoice (the rest will be processed in queue)
      const response = await fetch('https://oknofqytitpxmlprvekn.functions.supabase.co/sync-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoice_id: failedInvoices[0] })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry sync');
      }
      
      toast({
        title: "Retry started",
        description: `Started retrying sync for ${failedInvoices.length} failed invoice(s)`,
      });
      
      // Wait a moment to allow sync to start
      setTimeout(() => {
        fetchInvoices();
        setIsRetrySyncing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error retrying all syncs:', error);
      toast({
        title: "Retry error",
        description: error.message || "Failed to retry invoice syncs",
        variant: "destructive"
      });
      setIsRetrySyncing(false);
    }
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

        {/* Show error alert for token expiry */}
        {syncErrors.tokenExpired && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>QuickBooks Authorization Expired</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Your QuickBooks connection has expired. Please reconnect to continue syncing invoices.</p>
              <Button 
                size="sm" 
                onClick={() => navigate('/settings')}
                className="self-start"
              >
                Go to Settings
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Show alert for customer errors if there are any */}
        {syncErrors.customerErrors > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Customer Information Errors</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>There {syncErrors.customerErrors === 1 ? 'is' : 'are'} {syncErrors.customerErrors} invoice(s) with customer information errors.</p>
              {syncErrors.customerErrors > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleRetryAllFailedSyncs}
                  disabled={isRetrySyncing}
                  className="self-start"
                >
                  {isRetrySyncing ? 'Retrying...' : 'Retry All Failed Syncs'}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show alert for connectivity issues if there are any */}
        {syncErrors.connectivityIssues > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>QuickBooks Connectivity Issues</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>There {syncErrors.connectivityIssues === 1 ? 'is' : 'are'} {syncErrors.connectivityIssues} invoice(s) that couldn't be synced due to connectivity issues.</p>
              {syncErrors.connectivityIssues > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleRetryAllFailedSyncs}
                  disabled={isRetrySyncing}
                  className="self-start"
                >
                  {isRetrySyncing ? 'Retrying...' : 'Retry All Failed Syncs'}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
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
              onRetrySync={handleRetrySync}
              isRetrySyncing={isRetrySyncing}
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
