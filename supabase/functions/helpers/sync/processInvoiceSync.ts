
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { createInvoice as createQboInvoice } from "../accounting/adapters/qboInvoiceAdapter.ts";
import { logQboAction } from "../qbo.ts";

export async function processInvoiceSync(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log('Starting invoice sync process for:', invoiceId);
  
  try {
    // Get invoice data first
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, projects(*)')
      .eq('id', invoiceId)
      .single();
    
    if (invoiceError || !invoice) {
      throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Not found'}`);
    }

    // Mark as processing using the new upsert function
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_provider: 'qbo',
      p_status: 'processing'
    });

    console.log('Set sync status to processing for invoice:', invoiceId);

    // Create invoice in QBO
    const adapter = await createQboInvoice(supabase, invoice, environmentVars);
    
    // Record success using the new upsert function
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_provider: 'qbo',
      p_status: 'success',
      p_provider_ref: adapter.qboInvoiceId,
      p_provider_meta: adapter.providerMeta,
      p_error: null,
      p_error_message: null
    });

    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      payload: { 
        invoice_id: invoiceId,
        qbo_invoice_id: adapter.qboInvoiceId,
        http_status: 200
      },
      severity: 'info'
    });

    return { success: true };
    
  } catch (error) {
    console.error(`Error processing invoice ${invoiceId}:`, error);
    
    // Update sync record with error using the new upsert function
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_provider: 'qbo',
      p_status: 'error',
      p_error: { message: error.message },
      p_error_message: error.message
    });
    
    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      payload: { invoice_id: invoiceId },
      error: error.message,
      severity: 'error'
    });
    
    return { success: false, error: error.message };
  }
}
