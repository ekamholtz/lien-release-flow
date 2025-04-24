
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { logQboAction } from "../helpers/qbo.ts";

serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get failed syncs with retry attempts < 5
    const { data: failedInvoices, error: queryError } = await supabase
      .from('invoices')
      .select('id, qbo_retries')
      .eq('qbo_sync_status', 'error')
      .lt('qbo_retries', 5)
      .limit(10);

    if (queryError) {
      throw queryError;
    }

    if (!failedInvoices?.length) {
      return new Response(JSON.stringify({ message: 'No failed syncs to retry' }));
    }

    // Calculate delay for each retry based on exponential backoff
    // Formula: base_delay * 2^retry_count (in seconds)
    const BASE_DELAY = 60; // 1 minute base delay
    
    // Process each failed invoice with appropriate backoff
    const results = await Promise.all(
      failedInvoices.map(async (invoice) => {
        const retryCount = invoice.qbo_retries || 0;
        const backoffSeconds = BASE_DELAY * Math.pow(2, retryCount);
        
        // Calculate if enough time has passed since last sync attempt
        const { data: lastSync } = await supabase
          .from('invoices')
          .select('qbo_last_synced_at')
          .eq('id', invoice.id)
          .single();
          
        if (lastSync?.qbo_last_synced_at) {
          const lastSyncTime = new Date(lastSync.qbo_last_synced_at).getTime();
          const now = Date.now();
          const elapsedSeconds = (now - lastSyncTime) / 1000;
          
          // Skip if not enough time has passed according to backoff
          if (elapsedSeconds < backoffSeconds) {
            return {
              invoice_id: invoice.id,
              status: 'skipped',
              reason: `Backoff in progress (${Math.round(backoffSeconds - elapsedSeconds)}s remaining)`
            };
          }
        }
        
        // Trigger sync for this invoice
        try {
          const response = await fetch(
            'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-invoice',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({ invoice_id: invoice.id })
            }
          );
          
          const result = await response.json();
          
          return {
            invoice_id: invoice.id,
            status: result.success ? 'retried' : 'failed',
            result
          };
        } catch (error) {
          return {
            invoice_id: invoice.id,
            status: 'error',
            error: error.message
          };
        }
      })
    );

    // Log the retry attempt summary
    await logQboAction(supabase, {
      function_name: 'qbo-sync-retry',
      payload: { 
        processed: results.length,
        retried: results.filter(r => r.status === 'retried').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: results.filter(r => r.status === 'failed' || r.status === 'error').length
      },
      severity: 'info'
    });

    return new Response(
      JSON.stringify({ 
        processed: failedInvoices.length,
        results
      })
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
