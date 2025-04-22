
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
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

// Helper function to decode JWT payload
function getUserId(token: string): string {
  const [, payloadB64] = token.split(".");
  const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  return (JSON.parse(json).sub as string);
}

// OAuth authorize endpoint
const authorizeBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://appcenter.intuit.com/connect/oauth2"
    : "https://sandbox.appcenter.intuit.com/connect/oauth2";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Try to get user-id from the state query param if present
    const url = new URL(req.url);
    let userId = url.searchParams.get("state");

    // 2. Fall-back: accept a ?token= query param and decode it
    if (!userId) {
      const raw = url.searchParams.get("token");
      if (!raw) {
        throw new Error("Missing token parameter");
      }
      
      userId = getUserId(raw);
      console.log("Successfully extracted user ID from token:", userId);
    }

    // Ensure we have a user ID by this point
    if (!userId) {
      throw new Error("Cannot determine user identity");
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

    // Build Intuit URL exactly as before, using userId as state
    const params = new URLSearchParams({
      client_id: INTUIT_CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: QBO_REDIRECT_URI,
      response_type: "code",
      state: userId, // Use userId as state to tie the callback to user
    });

    const oauthUrl = `${authorizeBase}?${params.toString()}`;
    console.log("Redirecting to Intuit OAuth URL:", oauthUrl);

    // Return HTTP 302 redirect
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: oauthUrl },
    });
  } catch (error) {
    console.error("Authorization error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

