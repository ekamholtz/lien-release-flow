
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
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const INTUIT_CLIENT_ID = Deno.env.get('INTUIT_CLIENT_ID')!;
    const INTUIT_CLIENT_SECRET = Deno.env.get('INTUIT_CLIENT_SECRET')!;
    const INTUIT_ENVIRONMENT = Deno.env.get('INTUIT_ENVIRONMENT') || 'sandbox';

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse request
    const requestData = await req.json();
    
    // Handle both single invoice_id and array of ids
    const invoiceIds = requestData.invoice_ids || (requestData.invoice_id ? [requestData.invoice_id] : []);
    
    if (invoiceIds.length === 0) {
      // If no IDs provided, attempt to find pending invoices to process
      const { data: selectedInvoice, error: lockError } = await supabase.rpc('lock_next_pending_invoice');
      
      if (lockError) {
        throw new Error(`Failed to lock pending invoice: ${lockError.message}`);
      }
      
      if (!selectedInvoice) {
        return new Response(
          JSON.stringify({ message: 'No pending invoices found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      invoiceIds.push(selectedInvoice.id);
    }
    
    // Process each invoice
    const results = [];
    for (const invoiceId of invoiceIds) {
      try {
        // Get invoice data - only if not already selected via RPC
        let invoice;
        if (invoiceIds.length > 1 || !selectedInvoice) {
          // Attempt to lock invoice for processing
          const { data: lockedInvoice, error: lockError } = await supabase.rpc('lock_invoice_for_sync', { invoice_id: invoiceId });
          
          if (lockError || !lockedInvoice) {
            results.push({ 
              invoice_id: invoiceId, 
              success: false, 
              error: `Failed to lock invoice: ${lockError?.message || 'Already being processed or not found'}`
            });
            continue;
          }
          
          invoice = lockedInvoice;
        } else {
          invoice = selectedInvoice;
        }

        if (!invoice) {
          results.push({ 
            invoice_id: invoiceId, 
            success: false, 
            error: "Invoice not found or already being processed" 
          });
          continue;
        }
        
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

        // Map invoice to QBO format
        const qboInvoice = mapInvoiceToQbo(invoice, qboCustomerId);

        // Create invoice in QBO
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

        // Update invoice with QBO ID and status
        await supabase
          .from('invoices')
          .update({
            qbo_invoice_id: qboInvoiceId,
            qbo_sync_status: 'success',
            qbo_error: null,
            qbo_last_synced_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

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
        
        // Update invoice with error status
        await supabase
          .from('invoices')
          .update({
            qbo_sync_status: 'error',
            qbo_error: { message: error.message },
            qbo_last_synced_at: new Date().toISOString(),
            qbo_retries: supabase.rpc('increment_retries', { invoice_id: invoiceId })
          })
          .eq('id', invoiceId);
        
        // Log error with severity
        await logQboAction(supabase, {
          function_name: 'sync-invoice',
          payload: { invoice_id: invoiceId, retry_count: invoice?.qbo_retries || 0 },
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
