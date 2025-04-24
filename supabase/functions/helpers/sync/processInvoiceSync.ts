
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { createInvoice as createQboInvoice } from "../accounting/adapters/qboInvoiceAdapter.ts";
import { logQboAction } from "../qbo.ts";

export async function lockSyncRow(supabase: ReturnType<typeof createClient>, entityType: string, entityId: string) {
  console.log(`Locking sync row for ${entityType}:${entityId}`);
  
  // Get or create sync record
  const { data: syncRecord, error: syncError } = await supabase
    .from('accounting_sync')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      provider: 'qbo',
      status: 'processing',
      last_synced_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (syncError || !syncRecord) {
    console.error('Error locking sync record:', syncError);
    throw new Error(`Failed to lock sync record: ${syncError?.message || 'Not found'}`);
  }

  return syncRecord;
}

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

    // Lock the sync record and get user_id
    const syncRecord = await lockSyncRow(supabase, 'invoice', invoiceId);
    console.log('Obtained sync record:', syncRecord);

    if (!syncRecord.user_id) {
      throw new Error('No user_id associated with sync record');
    }

    // Create invoice in QBO
    const adapter = await createQboInvoice(supabase, invoice, environmentVars);
    
    // Record success
    await supabase
      .from('accounting_sync')
      .update({
        status: 'success',
        provider_ref: adapter.qboInvoiceId,
        provider_meta: adapter.providerMeta,
        error: null,
        last_synced_at: new Date().toISOString()
      })
      .eq('entity_type', 'invoice')
      .eq('entity_id', invoiceId);

    await logQboAction(supabase, {
      user_id: syncRecord.user_id,
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
    
    // Update sync record with error
    await supabase
      .from('accounting_sync')
      .update({
        status: 'error',
        error: { message: error.message },
        retries: supabase.rpc('increment_retries', { entity_id: invoiceId }),
        last_synced_at: new Date().toISOString()
      })
      .eq('entity_type', 'invoice')
      .eq('entity_id', invoiceId);
    
    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      payload: { invoice_id: invoiceId },
      error: error.message,
      severity: 'error'
    });
    
    return { success: false, error: error.message };
  }
}
