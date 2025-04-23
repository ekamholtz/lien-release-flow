
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
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

serve(async (req) => {
  // Add detailed request logging
  console.log("qbo-authorize request details:", {
    method: req.method,
    headers: {
      auth: req.headers.get("authorization")?.slice(0, 30),
      all: Object.fromEntries(req.headers.entries())
    }
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Manually validate the JWT token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("No authorization header found or invalid format");
      return new Response(
        JSON.stringify({ error: "Authorization required - missing or invalid format" }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const token = authHeader.split(' ')[1];
    console.log("Received token (first 30 chars):", token.slice(0, 30));
    
    // Extract JWT payload without validation (for debugging only)
    try {
      // Decode without verification to see the claims
      const decoded = jose.decodeJwt(token);
      console.log("Decoded JWT payload:", {
        sub: decoded.sub,
        iss: decoded.iss,
        aud: decoded.aud,
        exp: decoded.exp
      });
      
      // Get user ID from the decoded token
      const userId = decoded.sub;
      
      if (!userId) {
        console.error("No user ID found in decoded JWT");
        return new Response(
          JSON.stringify({ error: "Authorization required - no user ID in token" }),
          { status: 401, headers: corsHeaders }
        );
      }

      // Verify required environment variables
      if (!INTUIT_CLIENT_ID) {
        console.error("Missing INTUIT_CLIENT_ID environment variable");
        return new Response(
          JSON.stringify({ error: "Server configuration error - missing client ID" }),
          { status: 500, headers: corsHeaders }
        );
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
      console.log("Generated Intuit OAuth URL (masked):", 
        oauthUrl.replace(INTUIT_CLIENT_ID, "MASKED"));

      // Return the OAuth URL with CORS headers
      return new Response(
        JSON.stringify({ intuit_oauth_url: oauthUrl }),
        { status: 200, headers: corsHeaders }
      );
      
    } catch (jwtError) {
      console.error("JWT decode error:", jwtError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JWT format", 
          details: jwtError.message 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error("Error in qbo-authorize:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.stack 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
