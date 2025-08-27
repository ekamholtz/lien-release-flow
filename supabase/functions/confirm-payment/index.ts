import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
serve(async (req)=>{
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405
      });
    }
    const payload = await req.json();
    console.log("Webhook payload received:", payload);
    if (payload.event_type === "payin.succeeded") {
      const payinConfigId = payload?.data?.payin_config_id;
      const amount = payload?.data?.amount;
      if (!payinConfigId) {
        console.log("Missing payin_config_id in webhook payload");
        return new Response("Missing payin_config_id", {
          status: 400
        });
      }
      // Lookup invoice by payin_config_id
      const { data: invoiceRow, error: selectError } = await supabase.from("payment_invoices").select("*").eq("payin_config_id", payinConfigId).limit(1).single();
      if (selectError || !invoiceRow) {
        console.log("Invoice not found for payin_config_id:", payinConfigId, selectError);
        return new Response("Invoice not found", {
          status: 404
        });
      }
      const invoiceNumber = invoiceRow.entity_number;
      // Update payment_invoices table
      const { error: updatePaymentError } = await supabase.from("payment_invoices").update({
        status: "paid"
      }).eq("payin_config_id", payinConfigId);
      if (updatePaymentError) {
        console.log("Failed to update payment_invoices:", updatePaymentError);
        return new Response(JSON.stringify({
          error: updatePaymentError.message
        }), {
          status: 500
        });
      }
      // Update invoices table
      const { error: updateInvoiceError } = await supabase.from("invoices").update({
        status: "paid"
      }).eq("invoice_number", invoiceNumber);
      if (updateInvoiceError) {
        console.log("Failed to update invoices table:", updateInvoiceError);
        return new Response(JSON.stringify({
          error: updateInvoiceError.message
        }), {
          status: 500
        });
      }
      console.log(`Invoice ${invoiceNumber} marked as paid in both tables.`);
    }
    return new Response("ok", {
      status: 200
    });
  } catch (e) {
    console.log("Webhook handler error:", e);
    return new Response(JSON.stringify({
      error: e.message
    }), {
      status: 500
    });
  }
});
