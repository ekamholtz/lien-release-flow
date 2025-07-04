
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { processPaymentSync } from "../helpers/sync/processPaymentSync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('Starting sync-payment function');
  
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

    // Log environment vars to debug (removing sensitive values)
    console.log('Environment config:', {
      hasIntuitClientId: !!environmentVars.INTUIT_CLIENT_ID,
      hasIntuitClientSecret: !!environmentVars.INTUIT_CLIENT_SECRET,
      intuitEnvironment: environmentVars.INTUIT_ENVIRONMENT,
    });

    // Verify required environment variables
    if (!environmentVars.INTUIT_CLIENT_ID || !environmentVars.INTUIT_CLIENT_SECRET) {
      console.error('Missing required environment variables: INTUIT_CLIENT_ID and/or INTUIT_CLIENT_SECRET');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing QBO credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let requestData;
    
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Received request data:', requestData);
    
    const paymentIds = requestData.payment_ids || (requestData.payment_id ? [requestData.payment_id] : []);
    
    if (paymentIds.length === 0) {
      // Find pending payments that need to be synced
      const { data: pendingSync, error: pendingError } = await supabase
        .from('accounting_sync')
        .select('entity_id')
        .eq('entity_type', 'payment')
        .eq('provider', 'qbo')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (pendingError) {
        throw pendingError;
      }

      if (pendingSync?.length) {
        paymentIds.push(pendingSync[0].entity_id);
      } else {
        console.log('No pending payments found');
        return new Response(
          JSON.stringify({ message: 'No pending payments found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('Processing payments:', paymentIds);
    const results = [];
    for (const paymentId of paymentIds) {
      try {
        // First check if we have an existing sync record in a non-pending state
        const { data: existingSync } = await supabase
          .from('accounting_sync')
          .select('status')
          .eq('entity_type', 'payment')
          .eq('entity_id', paymentId)
          .eq('provider', 'qbo')
          .not('status', 'eq', 'pending')
          .single();
          
        // If there's already a successful sync, skip it
        if (existingSync && existingSync.status === 'success') {
          console.log(`Payment ${paymentId} already synced successfully, skipping`);
          results.push({
            payment_id: paymentId,
            success: true,
            message: 'Payment already synced'
          });
          continue;
        }
        
        // Before processing the sync, let's get the payment to verify data integrity
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();
        
        if (paymentError || !payment) {
          throw new Error(`Failed to fetch payment: ${paymentError?.message || 'Not found'}`);
        }
        
        // Process the sync
        const result = await processPaymentSync(supabase, paymentId, environmentVars);
        results.push({ ...result, payment_id: paymentId });
      } catch (error) {
        console.error(`Error in sync-payment for ${paymentId}:`, error);
        
        // Determine error type for better UI feedback
        let errorType = 'unknown';
        let errorMessage = error.message || String(error);
        
        if (error.errorType) {
          errorType = error.errorType;
        } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
          errorType = 'token-expired';
          errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
        } else if (errorMessage.includes('payment') || errorMessage.includes('invoice') || errorMessage.includes('bill')) {
          errorType = 'payment-error';
          errorMessage = `Payment error: ${errorMessage}`;
        } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
          errorType = 'connectivity';
          errorMessage = 'QuickBooks connectivity issue. Please try again later.';
        }
        
        results.push({ 
          payment_id: paymentId, 
          success: false, 
          error: errorMessage,
          errorType
        });
        
        // Update sync status to error
        try {
          // Get the payment to get company info for error logging
          const { data: payment } = await supabase
            .from('payments')
            .select('company_id')
            .eq('id', paymentId)
            .single();
            
          let userId = null;
          if (payment?.company_id) {
            const { data: member } = await supabase
              .from('company_members')
              .select('user_id')
              .eq('company_id', payment.company_id)
              .eq('status', 'active')
              .limit(1)
              .single();
            
            userId = member?.user_id;
          }
            
          await supabase.rpc('update_sync_status', {
            p_entity_type: 'payment',
            p_entity_id: paymentId,
            p_provider: 'qbo',
            p_status: 'error',
            p_error: { message: errorMessage, type: errorType },
            p_error_message: errorMessage,
            p_user_id: userId
          });
        } catch (updateError) {
          console.error('Failed to update sync status:', updateError);
        }
      }
    }

    console.log('Sync results:', results);
    return new Response(
      JSON.stringify({ success: results.every(r => r.success), results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-payment:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.errorType || 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
