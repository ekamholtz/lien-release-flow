
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { processBillSync } from "../helpers/sync/processBillSync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('Starting sync-bill function');
  
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
    
    const billIds = requestData.bill_ids || (requestData.bill_id ? [requestData.bill_id] : []);
    
    if (billIds.length === 0) {
      // Find pending bills that need to be synced
      const { data: pendingSync, error: pendingError } = await supabase
        .from('accounting_sync')
        .select('entity_id')
        .eq('entity_type', 'bill')
        .eq('provider', 'qbo')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (pendingError) {
        throw pendingError;
      }

      if (pendingSync?.length) {
        billIds.push(pendingSync[0].entity_id);
      } else {
        console.log('No pending bills found');
        return new Response(
          JSON.stringify({ message: 'No pending bills found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('Processing bills:', billIds);
    const results = [];
    for (const billId of billIds) {
      try {
        // First check if we have an existing sync record in a non-pending state
        const { data: existingSync } = await supabase
          .from('accounting_sync')
          .select('status')
          .eq('entity_type', 'bill')
          .eq('entity_id', billId)
          .eq('provider', 'qbo')
          .not('status', 'eq', 'pending')
          .single();
          
        // If there's already a successful sync, skip it
        if (existingSync && existingSync.status === 'success') {
          console.log(`Bill ${billId} already synced successfully, skipping`);
          results.push({
            bill_id: billId,
            success: true,
            message: 'Bill already synced'
          });
          continue;
        }
        
        // Before processing the sync, let's get the bill to verify data integrity
        const { data: bill, error: billError } = await supabase
          .from('bills')
          .select('*')
          .eq('id', billId)
          .single();
        
        if (billError || !bill) {
          throw new Error(`Failed to fetch bill: ${billError?.message || 'Not found'}`);
        }
        
        // Process the sync
        const result = await processBillSync(supabase, billId, environmentVars);
        results.push({ ...result, bill_id: billId });
      } catch (error) {
        console.error(`Error in sync-bill for ${billId}:`, error);
        
        // Determine error type for better UI feedback
        let errorType = 'unknown';
        let errorMessage = error.message || String(error);
        
        if (error.errorType) {
          errorType = error.errorType;
        } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
          errorType = 'token-expired';
          errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
        } else if (errorMessage.includes('bill') || errorMessage.includes('vendor')) {
          errorType = 'bill-error';
          errorMessage = `Bill error: ${errorMessage}`;
        } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
          errorType = 'connectivity';
          errorMessage = 'QuickBooks connectivity issue. Please try again later.';
        }
        
        results.push({ 
          bill_id: billId, 
          success: false, 
          error: errorMessage,
          errorType
        });
        
        // Update sync status to error
        try {
          // Get the bill to get company info for error logging
          const { data: bill } = await supabase
            .from('bills')
            .select('company_id')
            .eq('id', billId)
            .single();
            
          let userId = null;
          if (bill?.company_id) {
            const { data: member } = await supabase
              .from('company_members')
              .select('user_id')
              .eq('company_id', bill.company_id)
              .eq('status', 'active')
              .limit(1)
              .single();
            
            userId = member?.user_id;
          }
            
          await supabase.rpc('update_sync_status', {
            p_entity_type: 'bill',
            p_entity_id: billId,
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
    console.error('Error in sync-bill:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.errorType || 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
