
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { createQboInvoice } from "../accounting/providers/qbo.ts";
import { logQboAction } from "../qbo.ts";

interface SyncResult {
  invoice_id: string;
  success: boolean;
  qbo_invoice_id?: string;
  error?: string;
}

/**
 * Lock an invoice for syncing
 */
export async function lockInvoice(supabase: ReturnType<typeof createClient>, invoiceId: string) {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, projects(*)')
    .eq('id', invoiceId)
    .single();
  
  if (invoiceError || !invoice) {
    throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Not found'}`);
  }

  // Create or update sync record
  const { data: syncRecord } = await supabase
    .from('accounting_sync')
    .upsert({
      entity_type: 'invoice',
      entity_id: invoiceId,
      provider: 'qbo',
      status: 'processing',
      last_synced_at: new Date().toISOString()
    })
    .select()
    .single();

  return { invoice, syncRecord };
}

/**
 * Record the result of a sync operation
 */
export async function recordSyncResult(
  supabase: ReturnType<typeof createClient>,
  syncRecordId: string,
  success: boolean,
  result: {
    providerRef?: string;
    providerMeta?: any;
    error?: string;
  }
) {
  if (success) {
    await supabase
      .from('accounting_sync')
      .update({
        status: 'success',
        provider_ref: result.providerRef,
        provider_meta: result.providerMeta,
        error: null,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', syncRecordId);
  } else {
    await supabase
      .from('accounting_sync')
      .update({
        status: 'error',
        error: { message: result.error },
        retries: supabase.rpc('increment_retries', { invoice_id: null }),
        last_synced_at: new Date().toISOString()
      })
      .eq('id', syncRecordId);
  }
}

/**
 * Get the appropriate accounting provider adapter
 */
function getAccountingProvider(provider: string = 'qbo') {
  switch (provider) {
    case 'qbo':
      return { createInvoice: createQboInvoice };
    default:
      throw new Error(`Unsupported accounting provider: ${provider}`);
  }
}

/**
 * Process an invoice sync operation
 */
export async function processInvoiceSync(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  }
): Promise<SyncResult> {
  try {
    // Lock the invoice for syncing
    const { invoice, syncRecord } = await lockInvoice(supabase, invoiceId);

    // Get the appropriate provider adapter (only QBO for now)
    const adapter = getAccountingProvider('qbo');
    
    // Create invoice in provider
    const result = await adapter.createInvoice(supabase, invoice, environmentVars);

    // Record success
    await recordSyncResult(supabase, syncRecord.id, true, {
      providerRef: result.providerRef,
      providerMeta: result.providerMeta
    });

    return { 
      invoice_id: invoice.id, 
      success: true, 
      qbo_invoice_id: result.qboInvoiceId 
    };
    
  } catch (error) {
    console.error(`Error processing invoice ${invoiceId}:`, error);
    
    // Update sync record with error
    await supabase
      .from('accounting_sync')
      .update({
        status: 'error',
        error: { message: error.message },
        retries: supabase.rpc('increment_retries', { invoice_id: invoiceId }),
        last_synced_at: new Date().toISOString()
      })
      .eq('entity_type', 'invoice')
      .eq('entity_id', invoiceId)
      .eq('provider', 'qbo');
    
    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      payload: { invoice_id: invoiceId },
      error: error.message,
      severity: 'error'
    });
    
    return { 
      invoice_id: invoiceId, 
      success: false, 
      error: error.message 
    };
  }
}
