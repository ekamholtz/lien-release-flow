
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { QboSyncStatusBadge } from './QboSyncStatus';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define an extended invoice type that includes the project name from the join
// and QBO sync fields
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
  qbo_sync_status?: 'pending' | 'processing' | 'success' | 'error' | null;
  qbo_error?: { message: string } | null;
  qbo_invoice_id?: string | null;
  qbo_retries?: number;
  qbo_last_synced_at?: string | null;
};

interface InvoiceActionsProps {
  invoice: ExtendedInvoice;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>;
  onPayInvoice: (invoice: ExtendedInvoice) => void;
  onViewDetails: (invoice: ExtendedInvoice) => void;
}

export function InvoiceActions({ 
  invoice, 
  onUpdateStatus, 
  onPayInvoice, 
  onViewDetails 
}: InvoiceActionsProps) {
  const { session } = useAuth();
  const [isSyncing, setIsSyncing] = React.useState(false);
  
  const handleSyncToQbo = async () => {
    if (!session?.access_token || isSyncing) return;
    
    try {
      setIsSyncing(true);
      toast.info(`Syncing invoice ${invoice.invoice_number} to QuickBooks...`);
      
      const { error } = await supabase
        .from('invoices')
        .update({
          qbo_sync_status: 'pending',
        })
        .eq('id', invoice.id);
        
      if (error) throw error;
      
      const response = await fetch(
        'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-invoice',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ invoice_id: invoice.id })
        }
      );
      
      const result = await response.json();
      
      if (result.error || (result.results && result.results[0]?.error)) {
        const errorMsg = result.error || result.results[0]?.error || 'Sync failed';
        toast.error(`Failed to sync: ${errorMsg}`);
      } else {
        toast.success('Invoice successfully synced to QuickBooks!');
      }
    } catch (err: any) {
      console.error('Error syncing invoice:', err);
      toast.error(`Sync error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="flex items-center justify-end gap-2">
      {invoice.qbo_sync_status && (
        <QboSyncStatusBadge
          status={invoice.qbo_sync_status}
          errorMessage={invoice.qbo_error?.message}
          retries={invoice.qbo_retries}
          lastSynced={invoice.qbo_last_synced_at}
          showLabel={false}
          onRetry={invoice.qbo_sync_status === 'error' ? handleSyncToQbo : undefined}
        />
      )}
      
      {invoice.status !== 'paid' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPayInvoice(invoice)}
        >
          Pay
        </Button>
      )}
      
      {(invoice.qbo_sync_status === null || invoice.qbo_sync_status === 'error') && (
        <Button 
          variant="outline" 
          size="sm"
          disabled={isSyncing}
          onClick={handleSyncToQbo}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Syncing
            </>
          ) : (
            'Sync to QBO'
          )}
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
            View Details
          </DropdownMenuItem>
          
          {invoice.status === 'draft' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(invoice.id, 'sent')}>
              Mark as Sent
            </DropdownMenuItem>
          )}
          
          {invoice.status === 'sent' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(invoice.id, 'paid')}>
              Mark as Paid
            </DropdownMenuItem>
          )}
          
          {invoice.status !== 'overdue' && invoice.status !== 'paid' && (
            <DropdownMenuItem onClick={() => onUpdateStatus(invoice.id, 'overdue')}>
              Mark as Overdue
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
