
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { logQboAction } from "../helpers/qbo.ts";

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get failed bill syncs with retry attempts < 5
    const { data: failedSyncs, error: queryError } = await supabase
      .from('accounting_sync')
      .select('entity_id, retries')
      .eq('entity_type', 'bill')
      .eq('provider', 'qbo')
      .eq('status', 'error')
      .lt('retries', 5)
      .order('last_synced_at', { ascending: true });

    if (queryError) throw queryError;

    if (!failedSyncs?.length) {
      return new Response(
        JSON.stringify({ message: 'No failed bill syncs to retry' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate delay for each retry based on exponential backoff
    const BASE_DELAY = 60; // 1 minute base delay
    
    const results = await Promise.all(
      failedSyncs.map(async (sync) => {
        const retryCount = sync.retries || 0;
        const backoffSeconds = BASE_DELAY * Math.pow(2, retryCount);
        
        try {
          // Mark as pending before retry
          await supabase.rpc('update_sync_status', {
            p_entity_type: 'bill',
            p_entity_id: sync.entity_id,
            p_provider: 'qbo',
            p_status: 'pending'
          });
          
          const response = await fetch(
            'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-bill',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ bill_id: sync.entity_id })
            }
          );
          
          const result = await response.json();
          
          return {
            bill_id: sync.entity_id,
            status: result.success ? 'retried' : 'failed',
            result
          };
        } catch (error) {
          return {
            bill_id: sync.entity_id,
            status: 'error',
            error: error.message
          };
        }
      })
    );

    await logQboAction(supabase, {
      function_name: 'qbo-bill-sync-retry',
      payload: { 
        processed: results.length,
        retried: results.filter(r => r.status === 'retried').length,
        failed: results.filter(r => r.status === 'failed' || r.status === 'error').length
      },
      severity: 'info'
    });

    return new Response(
      JSON.stringify({ 
        processed: failedSyncs.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bill-sync-retry:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
