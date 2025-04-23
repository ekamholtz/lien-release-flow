
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// Get environment variables
const INTUIT_CLIENT_ID = Deno.env.get("INTUIT_CLIENT_ID");
const INTUIT_ENVIRONMENT = Deno.env.get("INTUIT_ENVIRONMENT") || "sandbox";

// Define possible redirect URIs - we'll try to match against what's configured in Intuit
const possibleRedirectURIs = [
  `https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback`,
  `https://oknofqytitpxmlprvekn.supabase.co/functions/v1/qbo-callback`,
];
// Use this as default if none are specified
const QBO_REDIRECT_URI = Deno.env.get("QBO_REDIRECT_URI") || possibleRedirectURIs[0];

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
    url: req.url,
    headers: {
      auth: req.headers.get("authorization")?.slice(0, 30) + "...",
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
    // Extract JWT token (but we're not validating it anymore since verify_jwt=false)
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log("Received token (first 30 chars):", token.slice(0, 30));
      
      try {
        // Decode without verification to see the claims
        const decoded = jose.decodeJwt(token);
        console.log("Decoded JWT payload:", {
          sub: decoded.sub,
          iss: decoded.iss,
          aud: decoded.aud,
          exp: decoded.exp
        });
        
        userId = decoded.sub;
      } catch (jwtError) {
        console.error("JWT decode error:", jwtError);
        // Continue even if JWT decode fails, we'll generate a response without userId
      }
    } else {
      console.log("No authorization header found or invalid format");
    }

    // Verify required environment variables
    if (!INTUIT_CLIENT_ID) {
      console.error("Missing INTUIT_CLIENT_ID environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error - missing client ID",
          debug: {
            env: {
              INTUIT_ENVIRONMENT,
              QBO_REDIRECT_URI: QBO_REDIRECT_URI || "not set"
            }
          }
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Build Intuit URL - use userId as state if available
    const params = new URLSearchParams({
      client_id: INTUIT_CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: QBO_REDIRECT_URI,
      response_type: "code",
      state: userId || "anonymous",
    });

    const oauthUrl = `${authorizeBase}?${params.toString()}`;
    console.log("Generated Intuit OAuth URL (masked):", 
      oauthUrl.replace(INTUIT_CLIENT_ID, "MASKED"));

    // Return the OAuth URL with CORS headers
    return new Response(
      JSON.stringify({ 
        intuit_oauth_url: oauthUrl,
        debug: {
          redirect_uri: QBO_REDIRECT_URI,
          possible_redirect_uris: possibleRedirectURIs,
          environment: INTUIT_ENVIRONMENT
        }
      }),
      { status: 200, headers: corsHeaders }
    );
      
  } catch (error) {
    console.error("Error in qbo-authorize:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.stack,
        debug: {
          headers: Object.fromEntries(req.headers.entries())
        }
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
