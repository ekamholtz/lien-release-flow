
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { ensureQboTokens, getOrCreateCustomer, logQboAction } from "../helpers/qbo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id } = await req.json();
    
    if (!invoice_id) {
      throw new Error('invoice_id is required');
    }

    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const INTUIT_CLIENT_ID = Deno.env.get('INTUIT_CLIENT_ID')!;
    const INTUIT_CLIENT_SECRET = Deno.env.get('INTUIT_CLIENT_SECRET')!;
    const INTUIT_ENVIRONMENT = Deno.env.get('INTUIT_ENVIRONMENT') || 'sandbox';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceError?.message}`);
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

    // Create invoice in QBO
    const apiBase = INTUIT_ENVIRONMENT === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';

    const qboInvoice = {
      CustomerRef: { value: qboCustomerId },
      DocNumber: invoice.invoice_number,
      DueDate: invoice.due_date,
      Line: [{
        Amount: invoice.amount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: { value: "1" } // Using default item
        }
      }]
    };

    const createResp = await fetch(
      `${apiBase}/v3/company/${tokens.realm_id}/invoice`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(qboInvoice)
      }
    );

    if (!createResp.ok) {
      const error = await createResp.text();
      await supabase
        .from('invoices')
        .update({
          qbo_sync_status: 'error',
          qbo_error: { message: error },
          qbo_last_synced_at: new Date().toISOString()
        })
        .eq('id', invoice_id);

      throw new Error(`QBO invoice creation failed: ${error}`);
    }

    const qboResponse = await createResp.json();

    // Update invoice with QBO ID and status
    await supabase
      .from('invoices')
      .update({
        qbo_invoice_id: qboResponse.Invoice.Id,
        qbo_sync_status: 'success',
        qbo_error: null,
        qbo_last_synced_at: new Date().toISOString()
      })
      .eq('id', invoice_id);

    await logQboAction(supabase, {
      user_id: invoice.user_id,
      function_name: 'sync-invoice',
      payload: { invoice_id, qbo_invoice_id: qboResponse.Invoice.Id }
    });

    return new Response(
      JSON.stringify({ success: true, qbo_invoice_id: qboResponse.Invoice.Id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-invoice:', error);
    
    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      error: error.message
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
