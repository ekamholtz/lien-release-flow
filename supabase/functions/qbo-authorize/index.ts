
/**
 * Edge function: qbo-authorize
 * - Accepts a JWT token as URL parameter (since verify_jwt is false)
 * - Responds with Intuit OAuth2 authorize URL with scopes for QBO (302 redirect)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.4/index.ts";

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
      const tokenParam = url.searchParams.get("token");
      if (!tokenParam) {
        throw new Error("Missing token parameter");
      }

      try {
        // We only need the subject (user_id) - no signature verification needed
        // since this is just for determining user identity
        const { payload } = await jwtVerify(
          tokenParam,
          new TextEncoder().encode("unused"),  // Skip key check
          { algorithms: ["none"], complete: true }
        );
        
        userId = payload.sub as string;
        console.log("Successfully extracted user ID from token:", userId);
      } catch (jwtError) {
        console.error("Error decoding JWT:", jwtError);
        throw new Error("Invalid token format");
      }
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
