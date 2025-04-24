
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get failed syncs with retry attempts < 5
    const { data: failedInvoices, error: queryError } = await supabase
      .from('invoices')
      .select('id')
      .eq('qbo_sync_status', 'error')
      .lt('qbo_retries', 5)
      .limit(10);

    if (queryError) {
      throw queryError;
    }

    if (!failedInvoices?.length) {
      return new Response(JSON.stringify({ message: 'No failed syncs to retry' }));
    }

    // Increment retry count
    await Promise.all(
      failedInvoices.map(invoice =>
        supabase
          .from('invoices')
          .update({ qbo_retries: invoice.qbo_retries + 1 })
          .eq('id', invoice.id)
      )
    );

    // Trigger sync for each invoice
    const results = await Promise.all(
      failedInvoices.map(invoice =>
        fetch(
          'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-invoice',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ invoice_id: invoice.id })
          }
        )
      )
    );

    return new Response(
      JSON.stringify({ 
        processed: failedInvoices.length,
        results: await Promise.all(results.map(r => r.json()))
      })
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
