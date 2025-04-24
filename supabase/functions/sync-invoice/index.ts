
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { processInvoiceSync } from "../helpers/sync/processInvoiceSync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('Starting sync-invoice function');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const environmentVars = {
      INTUIT_CLIENT_ID: Deno.env.get('INTUIT_CLIENT_ID')!,
      INTUIT_CLIENT_SECRET: Deno.env.get('INTUIT_CLIENT_SECRET')!,
      INTUIT_ENVIRONMENT: Deno.env.get('INTUIT_ENVIRONMENT') || 'sandbox'
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const requestData = await req.json();
    console.log('Received request data:', requestData);
    
    const invoiceIds = requestData.invoice_ids || (requestData.invoice_id ? [requestData.invoice_id] : []);
    
    if (invoiceIds.length === 0) {
      // Find pending invoices that need to be synced
      const { data: pendingSync, error: pendingError } = await supabase
        .from('accounting_sync')
        .select('entity_id')
        .eq('entity_type', 'invoice')
        .eq('provider', 'qbo')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (pendingError) {
        throw pendingError;
      }

      if (pendingSync?.length) {
        invoiceIds.push(pendingSync[0].entity_id);
      } else {
        console.log('No pending invoices found');
        return new Response(
          JSON.stringify({ message: 'No pending invoices found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('Processing invoices:', invoiceIds);
    const results = [];
    for (const invoiceId of invoiceIds) {
      try {
        // First check if we have an existing sync record in a non-pending state
        const { data: existingSync } = await supabase
          .from('accounting_sync')
          .select('status')
          .eq('entity_type', 'invoice')
          .eq('entity_id', invoiceId)
          .eq('provider', 'qbo')
          .not('status', 'eq', 'pending')
          .single();
          
        // If there's already a successful or processing sync, skip it
        if (existingSync && existingSync.status === 'success') {
          console.log(`Invoice ${invoiceId} already synced successfully, skipping`);
          results.push({
            invoice_id: invoiceId,
            success: true,
            message: 'Invoice already synced'
          });
          continue;
        }
        
        // Process the sync
        const result = await processInvoiceSync(supabase, invoiceId, environmentVars);
        results.push({ ...result, invoice_id: invoiceId });
      } catch (error) {
        console.error(`Error in sync-invoice for ${invoiceId}:`, error);
        results.push({ 
          invoice_id: invoiceId, 
          success: false, 
          error: error.message 
        });
      }
    }

    console.log('Sync results:', results);
    return new Response(
      JSON.stringify({ success: results.every(r => r.success), results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
