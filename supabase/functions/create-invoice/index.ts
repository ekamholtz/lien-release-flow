import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};
const json = (data, status = 200)=>new Response(JSON.stringify(data), {
    status,
    headers: cors
  });
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: cors
  });
  if (req.method !== "POST") return json({
    error: "Method Not Allowed"
  }, 405);
  const RAINFOREST_KEY = Deno.env.get("RAINFOREST__API_KEY");
  const MERCHANT_ID = Deno.env.get("RAINFOREST_MERCHANT_ID");
  const PUBLIC_BASE_URL = Deno.env.get("PUBLIC_BASE_URL") || 'http://localhost:8080';
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let body;
  try {
    body = await req.json();
  } catch  {
    return json({
      error: "Invalid JSON in request body"
    }, 400);
  }
  const { amount, currency = "USD", email, description = "Payment", user_id, entity_number } = body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return json({
      error: "Invalid or missing `amount`"
    }, 400);
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return json({
      error: "Invalid or missing `email`"
    }, 400);
  }
  const amountInMinorUnits = Math.round(amount * 100);
  console.log("Creating payin config with:", {
    amountInMinorUnits,
    merchant_id: MERCHANT_ID,
    amount,
    currency_code: currency,
    email,
    description
  });
  const payinCfgRes = await fetch("https://api.sandbox.rainforestpay.com/v1/payin_configs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RAINFOREST_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      merchant_id: MERCHANT_ID,
      idempotency_key: crypto.randomUUID(),
      amount: amountInMinorUnits,
      currency_code: currency,
      metadata: {
        invoice_number: entity_number
      }
    })
  });
  if (!payinCfgRes.ok) {
    const detail = await payinCfgRes.text();
    return json({
      error: "Rainforest PayinConfig failed",
      detail
    }, 502);
  }
  const resJson = await payinCfgRes.json();
  console.log("response of paying config", resJson);
  const payin_config_id = resJson?.data?.payin_config_id;
  const sessionRes = await fetch("https://api.sandbox.rainforestpay.com/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RAINFOREST_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ttl: 86400,
      statements: [
        {
          permissions: [
            "group#payment_component"
          ],
          constraints: {
            merchant: {
              merchant_id: MERCHANT_ID
            },
            payin_config: {
              payin_config_id
            }
          }
        }
      ]
    })
  });
  console.log("response of paying config", sessionRes);
  if (!sessionRes.ok) {
    const detail = await sessionRes.text();
    return json({
      error: "Rainforest session creation failed",
      detail
    }, 502);
  }
  const sessionResJson = await sessionRes.json();
  const { session_key, session_id } = sessionResJson?.data ?? {};
  if (!session_key) {
    return json({
      error: "Missing `session_key` in Rainforest response",
      detail: resJson
    }, 502);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { error } = await supabase.from("payment_invoices").insert({
    user_id,
    payin_config_id,
    session_key,
    amount,
    currency,
    email,
    description,
    entity_number,
    status: "DRAFT"
  });
  if (error) {
    return json({
      error: "Failed to save invoice in database",
      detail: error.message
    }, 500);
  }
  const paymentUrl = entity_number ? `${PUBLIC_BASE_URL}/pay?cfg=${payin_config_id}&sk=${session_key}&inv=${entity_number}` : `${PUBLIC_BASE_URL}/pay?cfg=${payin_config_id}&sk=${session_key}`;
  return json({
    success: true,
    paymentUrl
  }, 200);
});
