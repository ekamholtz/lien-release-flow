
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

// Define the canonical redirect URI
const QBO_REDIRECT_URI = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback";

const scopes = [
  "com.intuit.quickbooks.accounting"
];

const authorizeBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://appcenter.intuit.com/connect/oauth2"
    : "https://appcenter.intuit.com/connect/oauth2";

serve(async (req) => {
  // Add detailed request logging
  console.log("=== QBO Authorize Request ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('authorization');
    console.log("Authorization header present:", !!authHeader);
    console.log("Authorization header format:", authHeader?.substring(0, 20) + "...");
    
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({
        error: "Missing authorization header",
        details: "This endpoint requires authentication. Please ensure you are signed in."
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error("Invalid authorization header format");
      return new Response(JSON.stringify({
        error: "Invalid authorization header format",
        details: "Authorization header must start with 'Bearer '"
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const token = authHeader.split(' ')[1];
    console.log("JWT token extracted, length:", token.length);
    
    let userId = null;
    
    try {
      // Decode without verification to see the claims
      const decoded = jose.decodeJwt(token);
      console.log("JWT decoded successfully:", {
        sub: decoded.sub,
        iss: decoded.iss,
        aud: decoded.aud,
        exp: decoded.exp,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown'
      });
      
      userId = decoded.sub;
      
      // Check if token is expired
      if (decoded.exp && Date.now() / 1000 > decoded.exp) {
        console.error("JWT token is expired");
        return new Response(JSON.stringify({
          error: "Token expired",
          details: "Your session has expired. Please refresh the page and sign in again."
        }), { 
          status: 401, 
          headers: corsHeaders 
        });
      }
      
    } catch (jwtError) {
      console.error("JWT decode error:", jwtError);
      return new Response(JSON.stringify({
        error: "Invalid token",
        details: "Unable to process authentication token. Please refresh the page and try again."
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify required environment variables
    if (!INTUIT_CLIENT_ID) {
      console.error("Missing INTUIT_CLIENT_ID environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          details: "QuickBooks integration is not properly configured. Please contact support."
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!userId) {
      console.error("Could not extract user ID from JWT");
      return new Response(
        JSON.stringify({ 
          error: "Invalid user session",
          details: "Could not identify user from session. Please sign in again."
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log("All validations passed, generating OAuth URL");
    
    // Build Intuit URL with fixed redirect URI
    const params = new URLSearchParams({
      client_id: INTUIT_CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: QBO_REDIRECT_URI,
      response_type: "code",
      state: userId,
    });

    const oauthUrl = `${authorizeBase}?${params.toString()}`;
    console.log("Generated OAuth URL for user:", userId);
    console.log("OAuth URL (masked):", oauthUrl.replace(INTUIT_CLIENT_ID, "***CLIENT_ID***"));

    // Return the OAuth URL with CORS headers
    return new Response(
      JSON.stringify({ 
        intuit_oauth_url: oauthUrl,
        debug: {
          redirect_uri: QBO_REDIRECT_URI,
          environment: INTUIT_ENVIRONMENT,
          authorize_base: authorizeBase,
          user_id: userId,
          scopes: scopes
        }
      }),
      { status: 200, headers: corsHeaders }
    );
      
  } catch (error) {
    console.error("Unexpected error in qbo-authorize:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: "An unexpected error occurred. Please try again or contact support if the problem persists.",
        debug: {
          message: error.message,
          stack: error.stack
        }
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
