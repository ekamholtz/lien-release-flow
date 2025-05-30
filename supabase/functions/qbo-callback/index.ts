
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { upsertQboConnection, logQboAction } from "../helpers/qbo.ts";

const INTUIT_CLIENT_ID = Deno.env.get("INTUIT_CLIENT_ID")!;
const INTUIT_CLIENT_SECRET = Deno.env.get("INTUIT_CLIENT_SECRET")!;
const INTUIT_ENVIRONMENT = Deno.env.get("INTUIT_ENVIRONMENT") || "sandbox";
const APP_URL = Deno.env.get("APP_URL")!;
const QBO_REDIRECT_URI = "https://oknofqytitpxmlprvekn.functions.supabase.co/qbo-callback";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tokenBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    : "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  console.log("qbo-callback received request:", {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries())
  });
  
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
      return new Response(null, {
        status: 302,
        headers: { 
          ...corsHeaders,
          location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent(authError)}` 
        }
      });
    }
    
    if (!code || !user_id || !realm_id) {
      const errorMessage = "Missing required parameters";
      console.error(errorMessage, { code, user_id, realm_id });
      return new Response(null, {
        status: 302,
        headers: { 
          ...corsHeaders,
          location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent("Missing code/user/realm")}` 
        }
      });
    }

    if (!INTUIT_CLIENT_ID || !INTUIT_CLIENT_SECRET || !APP_URL) {
      const errorMessage = "Missing required environment variables";
      console.error(errorMessage);
      return new Response(null, {
        status: 302,
        headers: { 
          ...corsHeaders,
          location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent("Server configuration error")}` 
        }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user exists in database before proceeding
    const { data: userExists, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();

    if (userCheckError || !userExists) {
      console.error("User verification failed:", userCheckError || "User not found");
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent("Invalid user")}`
        }
      });
    }

    // Check for existing refresh token before exchange
    const { data: existing } = await supabase
      .from('qbo_connections')
      .select('refresh_token')
      .eq('user_id', user_id)
      .eq('realm_id', realm_id)
      .maybeSingle();

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
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent("Failed to exchange token: " + errString)}`
        }
      });
    }

    const tokens = await tokenResp.json();
    console.log("Token exchange successful:", { 
      access_token: "***", 
      refresh_token: tokens.refresh_token ? "***" : "not_provided",
      expires_in: tokens.expires_in 
    });
    
    try {
      await upsertQboConnection(
        supabase, 
        user_id, 
        realm_id,
        tokens.access_token,
        tokens.refresh_token || (existing?.refresh_token ?? ""),
        tokens.expires_in || 3600,
        tokens.scope
      );
    } catch (dbError: any) {
      console.error("Database error storing tokens:", dbError);
      await logQboAction(supabase, {
        user_id,
        function_name: "qbo-callback",
        error: "Database error: " + dbError.message
      });
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent("Database error storing connection")}`
        }
      });
    }

    await logQboAction(supabase, {
      user_id,
      function_name: "qbo-callback",
      payload: { realm_id, success: true }
    });

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        location: `${APP_URL}/settings?connected=qbo`
      }
    });
  } catch (err) {
    console.error("Unexpected error in qbo-callback:", err);
    try {
      const url = new URL(req.url);
      const user_id = url.searchParams.get("state");
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
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        location: `${APP_URL}/settings?error=qbo&message=${encodeURIComponent("Internal error")}`
      }
    });
  }
});
