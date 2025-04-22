
/**
 * Edge function: qbo-authorize
 * - Verifies JWT (user must be signed-in)
 * - Responds with Intuit OAuth2 authorize URL with scopes for QBO (302 redirect)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment
const INTUIT_CLIENT_ID = Deno.env.get("INTUIT_CLIENT_ID");
const INTUIT_ENVIRONMENT = Deno.env.get("INTUIT_ENVIRONMENT") || "sandbox";
// Set a specific fallback redirect URI if the environment variable is not set
const QBO_REDIRECT_URI = Deno.env.get("QBO_REDIRECT_URI") || 
  `https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback`;

const scopes = [
  "com.intuit.quickbooks.accounting"
];

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

  // Parse user info from JWT claim
  // "sub" from the access_token is the user_id
  let user_id: string | undefined;
  try {
    let token: string | undefined;
    
    // First try to get token from Authorization header
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get it from URL query param
    if (!token) {
      const url = new URL(req.url);
      token = url.searchParams.get("token") || undefined;
    }
    
    // If still no token, throw error
    if (!token) {
      throw new Error("No token provided in Authorization header or URL param");
    }
    
    // Parse the JWT payload
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    user_id = payload.sub;
    if (!user_id) throw new Error("Missing user_id from token");
    
    console.log("Successfully authenticated user:", user_id);
  } catch (e) {
    console.error("Authentication error:", e);
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid/missing token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log environment variables for debugging
  console.log("INTUIT_CLIENT_ID:", INTUIT_CLIENT_ID ? "Set" : "Not set");
  console.log("QBO_REDIRECT_URI:", QBO_REDIRECT_URI);
  console.log("INTUIT_ENVIRONMENT:", INTUIT_ENVIRONMENT);

  if (!INTUIT_CLIENT_ID) {
    console.error("Missing INTUIT_CLIENT_ID environment variable");
    return new Response(JSON.stringify({ error: "Server configuration error: Missing Intuit client ID" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams({
    client_id: INTUIT_CLIENT_ID,
    scope: scopes.join(" "),
    redirect_uri: QBO_REDIRECT_URI,
    response_type: "code",
    state: user_id, // for tying callback to user
  });

  const oauthUrl = `${authorizeBase}?${params.toString()}`;
  // Remove JSON response and instead return HTTP 302 redirect
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: oauthUrl },
  });
});
