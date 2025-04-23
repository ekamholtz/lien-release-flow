
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req, ctx) => {
  // Log incoming request details
  console.log("QBO authorize request:", {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    url: req.url
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify we have a user ID from the JWT context
    const userId = ctx?.jwt?.sub;
    console.log("User ID from JWT:", userId);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authorization required - invalid or missing JWT" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify required environment variables
    if (!INTUIT_CLIENT_ID) {
      console.error("Missing INTUIT_CLIENT_ID environment variable");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Intuit URL with user ID as state
    const params = new URLSearchParams({
      client_id: INTUIT_CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: QBO_REDIRECT_URI,
      response_type: "code",
      state: userId,
    });

    const oauthUrl = `${authorizeBase}?${params.toString()}`;
    console.log("Generated Intuit OAuth URL (masked):", oauthUrl.replace(INTUIT_CLIENT_ID, "MASKED"));

    // Return the OAuth URL as JSON
    return new Response(JSON.stringify({ intuit_oauth_url: oauthUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in qbo-authorize:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
