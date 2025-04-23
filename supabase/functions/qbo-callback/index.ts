
/**
 * Edge function: qbo-callback
 * - exchanges code for tokens, stores in qbo_connections (upsert on user_id+realm)
 * - logs successes/errors in qbo_logs
 * - public (no JWT required)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { upsertQboConnection, logQboAction } from "../helpers/qbo.ts";

// Env
const INTUIT_CLIENT_ID = Deno.env.get("INTUIT_CLIENT_ID")!;
const INTUIT_CLIENT_SECRET = Deno.env.get("INTUIT_CLIENT_SECRET")!;
const INTUIT_ENVIRONMENT = Deno.env.get("INTUIT_ENVIRONMENT") || "sandbox";
// Use fixed redirect URI
const QBO_REDIRECT_URI = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tokenBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    : "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

serve(async (req) => {
  console.log("qbo-callback received request:", {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries())
  });
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };
  
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Parse code, state (user_id) and realmId
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const user_id = url.searchParams.get("state");
    const realm_id = url.searchParams.get("realmId");
    const authError = url.searchParams.get("error");
    
    console.log("Callback parameters:", { code: !!code, user_id, realm_id, error: authError });
    
    if (authError) {
      return new Response(`Authorization denied: ${authError}`, { 
        status: 400,
        headers: corsHeaders  
      });
    }
    
    if (!code || !user_id || !realm_id) {
      return new Response("Missing code/user/realm", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    if (!INTUIT_CLIENT_ID || !INTUIT_CLIENT_SECRET) {
      console.error("Missing required environment variables for token exchange");
      return new Response("Server configuration error", { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Exchange code for tokens with fixed redirect URI
    const basicAuth = 'Basic ' + btoa(`${INTUIT_CLIENT_ID}:${INTUIT_CLIENT_SECRET}`);
    console.log("Requesting token exchange with redirect URI:", QBO_REDIRECT_URI);
    
    const tokenResp = await fetch(tokenBase, {
      method: "POST",
      headers: {
        "Authorization": basicAuth,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: QBO_REDIRECT_URI
      }).toString()
    });

    if (!tokenResp.ok) {
      const errString = await tokenResp.text();
      console.error("Token exchange failed:", errString);
      await logQboAction(supabase, {
        user_id,
        function_name: "qbo-callback",
        error: "Token exchange failed: " + errString
      });
      return new Response(errString, { 
        status: 502,
        headers: corsHeaders 
      });
    }

    const data = await tokenResp.json();
    console.log("Token exchange successful:", { access_token: "***", refresh_token: "***", expires_in: data.expires_in });
    
    // Store tokens + expires_at (properly using expires_in)
    const dbError = await upsertQboConnection(supabase, user_id, realm_id, {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      scope: data.scope,
      expires_in: data.expires_in
    });

    if (dbError) {
      await logQboAction(supabase, {
        user_id,
        function_name: "qbo-callback",
        error: "Upsert qbo_connection failed: " + dbError.message
      });
      return new Response("DB error", { 
        status: 500,
        headers: corsHeaders 
      });
    }

    await logQboAction(supabase, {
      user_id,
      function_name: "qbo-callback",
      payload: { realm_id, success: true }
    });

    // redirect to /integrations (frontend)
    return new Response(undefined, {
      status: 302,
      headers: { 
        ...corsHeaders,
        location: "/integrations" 
      }
    });
  } catch (err) {
    // Log unexpected error
    console.error("Unexpected error in qbo-callback:", err);
    try {
      const { user_id } = Object.fromEntries(new URL(req.url).searchParams.entries());
      await logQboAction(
        createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
        {
          user_id,
          function_name: "qbo-callback",
          error: "Unexpected: " + (err?.message || String(err))
        }
      );
    } catch (e) {
      console.error("Failed to log error:", e);
    }
    return new Response("Internal error", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
