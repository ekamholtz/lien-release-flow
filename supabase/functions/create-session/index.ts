import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
  if (req.method !== "POST") {
    return json({
      success: false,
      error_code: "METHOD_NOT_ALLOWED",
      message: "Only POST allowed"
    }, 405);
  }
  const RAINFOREST_KEY = Deno.env.get("RAINFOREST__API_KEY");
  const MERCHANT_ID = Deno.env.get("RAINFOREST_MERCHANT_ID");
  let body;
  try {
    body = await req.json();
  } catch  {
    return json({
      success: false,
      error_code: "INVALID_JSON",
      message: "Invalid JSON in request body"
    }, 400);
  }
  const { payin_config_id } = body;
  if (!payin_config_id || typeof payin_config_id !== "string") {
    return json({
      success: false,
      error_code: "INVALID_INPUT",
      message: "Invalid or missing `payin_config_id`"
    }, 400);
  }
  try {
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
    if (!sessionRes.ok) {
      const detail = await sessionRes.text();
      return json({
        success: false,
        error_code: "RAINFOREST_API_ERROR",
        message: "Rainforest session creation failed",
        detail
      }, 502);
    }
    const sessionData = await sessionRes.json();
    const { session_key, session_id } = sessionData?.data ?? {};
    if (!session_key) {
      return json({
        success: false,
        error_code: "MISSING_SESSION_KEY",
        message: "No `session_key` returned by Rainforest",
        detail: sessionData
      }, 502);
    }
    return json({
      success: true,
      session_key,
      session_id
    }, 200);
  } catch (err) {
    return json({
      success: false,
      error_code: "INTERNAL_ERROR",
      message: "Unexpected server error",
      detail: err.message
    }, 500);
  }
});
