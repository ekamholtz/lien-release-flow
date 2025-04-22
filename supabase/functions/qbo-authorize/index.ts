
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment
const INTUIT_CLIENT_ID = Deno.env.get("INTUIT_CLIENT_ID");
const INTUIT_ENVIRONMENT = Deno.env.get("INTUIT_ENVIRONMENT") || "sandbox";
const QBO_REDIRECT_URI = Deno.env.get("QBO_REDIRECT_URI") || 
  `https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback`;

const scopes = [
  "com.intuit.quickbooks.accounting"
];

const authorizeBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://appcenter.intuit.com/connect/oauth2"
    : "https://sandbox.appcenter.intuit.com/connect/oauth2";

/**
 * Main handler
 * Uses Supabase JWT verification (verify_jwt = true).
 * Pulls user id from ctx.jwt.sub (set by edge runtime after valid Authorization: Bearer ...)
 */
serve(async (req, ctx) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Get user id from the verified JWT context
    const userId = ctx?.jwt?.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authorization required - invalid or missing JWT" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log environment variables for debugging
    console.log("INTUIT_CLIENT_ID:", INTUIT_CLIENT_ID ? "Set" : "Not set");
    console.log("QBO_REDIRECT_URI:", QBO_REDIRECT_URI);
    console.log("INTUIT_ENVIRONMENT:", INTUIT_ENVIRONMENT);
    console.log("User ID for state:", userId);

    if (!INTUIT_CLIENT_ID) {
      console.error("Missing INTUIT_CLIENT_ID environment variable");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Intuit client ID" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Intuit URL, using userId as state
    const params = new URLSearchParams({
      client_id: INTUIT_CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: QBO_REDIRECT_URI,
      response_type: "code",
      state: userId,
    });

    const oauthUrl = `${authorizeBase}?${params.toString()}`;
    console.log("Returning Intuit OAuth URL:", oauthUrl);

    // New: Always return the OAuth URL as JSON (never redirect)
    return new Response(JSON.stringify({ intuit_oauth_url: oauthUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Authorization error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
