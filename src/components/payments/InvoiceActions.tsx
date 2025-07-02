import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, FileText } from "lucide-react";
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { QboSyncStatusBadge } from './QboSyncStatus';
import { PdfGenerationDialog } from './pdf/PdfGenerationDialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define sync_status as a string union
type sync_status = 'pending' | 'processing' | 'success' | 'error';

type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
  accounting_sync?: {
    status: sync_status;
    error?: { message: string; type?: string } | null;
    error_message?: string | null;
    retries?: number;
    last_synced_at?: string | null;
  } | null;
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
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = React.useState(false);
  
  const handleSyncToQbo = async () => {
    if (!session?.access_token || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      toast({
        title: "Syncing invoice...",
        description: `Starting sync for invoice ${invoice.invoice_number} to QuickBooks`,
      });
      
      // First check if there's already a sync record for this invoice
      const { data: existingSync, error: checkError } = await supabase
        .from('accounting_sync')
        .select('*')
        .eq('entity_type', 'invoice')
        .eq('entity_id', invoice.id)
        .eq('provider', 'qbo')
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // If there's an existing record in error state, update it to pending
      // If no record exists, create a new one
      if (existingSync) {
        if (existingSync.status === 'error') {
          const { error: updateError } = await supabase
            .from('accounting_sync')
            .update({
              status: 'pending',
              error: null,
              error_message: null
            })
            .eq('id', existingSync.id);
            
          if (updateError) throw updateError;
        } else if (existingSync.status === 'success') {
          throw new Error('Invoice is already synced to QuickBooks');
        } else if (existingSync.status === 'processing') {
          throw new Error('Invoice sync is already in progress');
        }
      } else {
        // Create new sync record
        const { error: syncError } = await supabase
          .from('accounting_sync')
          .insert({
            entity_type: 'invoice',
            entity_id: invoice.id,
            provider: 'qbo',
            status: 'pending',
            user_id: session.user.id
          });
            
        if (syncError) throw syncError;
      }
      
      try {
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
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Network error: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.error || (result.results && result.results[0]?.error)) {
          const errorMsg = result.error || result.results[0]?.error || 'Sync failed';
          
          // Check for specific QuickBooks connectivity issues
          if (errorMsg.includes('sending request for url') || errorMsg.includes('QuickBooks connectivity issue')) {
            setSyncError('QuickBooks connection issue. Please try again later.');
            toast({
              title: "QuickBooks Connection Issue",
              description: "Unable to connect to QuickBooks servers. This may be a temporary network issue. Please try again later.",
              variant: "destructive"
            });
          } else {
            setSyncError(errorMsg);
            toast({
              title: "Sync failed",
              description: errorMsg,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Sync successful",
            description: "Invoice successfully synced to QuickBooks!"
          });
          
          // Optionally refresh the page or update the UI to show the new sync status
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (fetchError: any) {
        console.error('Network error syncing invoice:', fetchError);
        setSyncError('Network connection issue. Please check your internet connection and try again.');
        toast({
          title: "Network Error",
          description: "Unable to connect to sync service. Please check your internet connection and try again.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error syncing invoice:', err);
      setSyncError(err.message || 'Unknown error occurred');
      toast({
        title: "Sync failed",
        description: err.message || 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="flex items-center justify-end gap-2">
      {invoice.accounting_sync && (
        <QboSyncStatusBadge
          status={invoice.accounting_sync.status}
          errorMessage={invoice.accounting_sync.error?.message || invoice.accounting_sync.error_message}
          retries={invoice.accounting_sync.retries}
          lastSynced={invoice.accounting_sync.last_synced_at}
          showLabel={false}
          onRetry={invoice.accounting_sync.status === 'error' ? handleSyncToQbo : undefined}
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
      
      {(!invoice.accounting_sync || invoice.accounting_sync.status === 'error') && (
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

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsPdfDialogOpen(true)}
      >
        <FileText className="mr-1 h-3 w-3" />
        PDF
      </Button>
      
      {syncError && (
        <div className="text-xs text-red-500" title={syncError}>
          Sync error
        </div>
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

      <PdfGenerationDialog
        invoice={invoice}
        isOpen={isPdfDialogOpen}
        onClose={() => setIsPdfDialogOpen(false)}
      />
    </div>
  );
}
