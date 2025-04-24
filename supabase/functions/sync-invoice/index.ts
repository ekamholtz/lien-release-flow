
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { 
  ensureQboTokens, 
  getOrCreateCustomer, 
  mapInvoiceToQbo,
  batchCreateInQbo, 
  logQboAction 
} from "../helpers/qbo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase;
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const INTUIT_CLIENT_ID = Deno.env.get('INTUIT_CLIENT_ID')!;
    const INTUIT_CLIENT_SECRET = Deno.env.get('INTUIT_CLIENT_SECRET')!;
    const INTUIT_ENVIRONMENT = Deno.env.get('INTUIT_ENVIRONMENT') || 'sandbox';

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const requestData = await req.json();
    const invoiceIds = requestData.invoice_ids || (requestData.invoice_id ? [requestData.invoice_id] : []);
    
    if (invoiceIds.length === 0) {
      // Find pending syncs to process
      const { data: pendingSync } = await supabase
        .from('accounting_sync')
        .select('entity_id')
        .eq('entity_type', 'invoice')
        .eq('provider', 'qbo')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (pendingSync?.length) {
        invoiceIds.push(pendingSync[0].entity_id);
      } else {
        return new Response(
          JSON.stringify({ message: 'No pending invoices found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const results = [];
    for (const invoiceId of invoiceIds) {
      try {
        // Get invoice data
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

        // Get user's QBO tokens
        const tokens = await ensureQboTokens(
          supabase,
          invoice.user_id,
          { INTUIT_CLIENT_ID, INTUIT_CLIENT_SECRET, INTUIT_ENVIRONMENT }
        );

        // Get or create QBO customer
        const qboCustomerId = await getOrCreateCustomer(
          supabase,
          invoice.user_id,
          {
            external_id: invoice.client_email,
            display_name: invoice.client_name,
            email: invoice.client_email
          },
          tokens,
          { INTUIT_ENVIRONMENT }
        );

        // Map and create invoice in QBO
        const qboInvoice = mapInvoiceToQbo(invoice, qboCustomerId);
        const qboResponses = await batchCreateInQbo(
          [qboInvoice],
          'Invoice',
          tokens,
          { INTUIT_ENVIRONMENT }
        );
        
        if (!qboResponses.length || !qboResponses[0].Invoice?.Id) {
          throw new Error('QBO did not return an invoice ID');
        }

        const qboInvoiceId = qboResponses[0].Invoice.Id;

        // Update sync record with success
        await supabase
          .from('accounting_sync')
          .update({
            status: 'success',
            provider_ref: qboInvoiceId,
            provider_meta: qboResponses[0],
            error: null,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', syncRecord.id);

        await logQboAction(supabase, {
          user_id: invoice.user_id,
          function_name: 'sync-invoice',
          payload: { invoice_id: invoice.id, qbo_invoice_id: qboInvoiceId },
          severity: 'info'
        });

        results.push({ 
          invoice_id: invoice.id, 
          success: true, 
          qbo_invoice_id: qboInvoiceId 
        });
        
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
        
        results.push({ 
          invoice_id: invoiceId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return new Response(
      JSON.stringify({ success: results.every(r => r.success), results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-invoice:', error);
    
    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      error: error.message,
      severity: 'error'
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
