
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { processVendorSync } from "../helpers/sync/processVendorSync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('Starting sync-vendor function');
  
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
    
    const vendorIds = requestData.vendor_ids || (requestData.vendor_id ? [requestData.vendor_id] : []);
    
    if (vendorIds.length === 0) {
      // Find pending vendors that need to be synced
      const { data: pendingSync, error: pendingError } = await supabase
        .from('accounting_sync')
        .select('entity_id')
        .eq('entity_type', 'vendor')
        .eq('provider', 'qbo')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (pendingError) {
        throw pendingError;
      }

      if (pendingSync?.length) {
        vendorIds.push(pendingSync[0].entity_id);
      } else {
        console.log('No pending vendors found');
        return new Response(
          JSON.stringify({ message: 'No pending vendors found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('Processing vendors:', vendorIds);
    const results = [];
    for (const vendorId of vendorIds) {
      try {
        // First check if we have an existing sync record in a non-pending state
        const { data: existingSync } = await supabase
          .from('accounting_sync')
          .select('status')
          .eq('entity_type', 'vendor')
          .eq('entity_id', vendorId)
          .eq('provider', 'qbo')
          .not('status', 'eq', 'pending')
          .single();
          
        // If there's already a successful sync, skip it
        if (existingSync && existingSync.status === 'success') {
          console.log(`Vendor ${vendorId} already synced successfully, skipping`);
          results.push({
            vendor_id: vendorId,
            success: true,
            message: 'Vendor already synced'
          });
          continue;
        }
        
        // Before processing the sync, let's get the vendor to verify data integrity
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();
        
        if (vendorError || !vendor) {
          throw new Error(`Failed to fetch vendor: ${vendorError?.message || 'Not found'}`);
        }
        
        // Process the sync
        const result = await processVendorSync(supabase, vendorId, environmentVars);
        results.push({ ...result, vendor_id: vendorId });
      } catch (error) {
        console.error(`Error in sync-vendor for ${vendorId}:`, error);
        
        // Determine error type for better UI feedback
        let errorType = 'unknown';
        let errorMessage = error.message || String(error);
        
        if (error.errorType) {
          errorType = error.errorType;
        } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
          errorType = 'token-expired';
          errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
        } else if (errorMessage.includes('vendor') || errorMessage.includes('contact')) {
          errorType = 'vendor-error';
          errorMessage = `Vendor error: ${errorMessage}`;
        } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
          errorType = 'connectivity';
          errorMessage = 'QuickBooks connectivity issue. Please try again later.';
        }
        
        results.push({ 
          vendor_id: vendorId, 
          success: false, 
          error: errorMessage,
          errorType
        });
        
        // Update sync status to error
        try {
          // Get the vendor to get company info for error logging
          const { data: vendor } = await supabase
            .from('vendors')
            .select('company_id')
            .eq('id', vendorId)
            .single();
            
          let userId = null;
          if (vendor?.company_id) {
            const { data: member } = await supabase
              .from('company_members')
              .select('user_id')
              .eq('company_id', vendor.company_id)
              .eq('status', 'active')
              .limit(1)
              .single();
            
            userId = member?.user_id;
          }
            
          await supabase.rpc('update_sync_status', {
            p_entity_type: 'vendor',
            p_entity_id: vendorId,
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
    console.error('Error in sync-vendor:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.errorType || 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
