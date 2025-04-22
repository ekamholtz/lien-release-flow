
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
const QBO_REDIRECT_URI = Deno.env.get("QBO_REDIRECT_URI")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Token endpoint
const tokenBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    : "https://sandbox-accounts.platform.intuit.com/oauth2/v1/tokens/bearer";

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
    }
    // Parse code, state (user_id) and realmId
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const user_id = url.searchParams.get("state");
    const realm_id = url.searchParams.get("realmId");
    if (!code || !user_id || !realm_id) {
      return new Response("Missing code/user/realm", { status: 400 });
    }

    // Exchange code for tokens
    const basicAuth = 'Basic ' + btoa(`${INTUIT_CLIENT_ID}:${INTUIT_CLIENT_SECRET}`);
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
      await logQboAction(new createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY), {
        user_id,
        function_name: "qbo-callback",
        error: "Token exchange failed: " + errString
      });
      return new Response(errString, { status: 502 });
    }

    const data = await tokenResp.json();
    // Store tokens + expires_at (properly using expires_in)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const error = await upsertQboConnection(supabase, user_id, realm_id, {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      scope: data.scope,
      expires_in: data.expires_in
    });

    if (error) {
      await logQboAction(supabase, {
        user_id,
        function_name: "qbo-callback",
        error: "Upsert qbo_connection failed: " + error.message
      });
      return new Response("DB error", { status: 500 });
    }

    await logQboAction(supabase, {
      user_id,
      function_name: "qbo-callback",
      payload: { realm_id, ...data }
    });

    // redirect to /integrations (frontend)
    return new Response(undefined, {
      status: 302,
      headers: { location: "/integrations" }
    });
  } catch (error) {
    // Log unexpected error
    try {
      const { user_id } = Object.fromEntries(new URL(req.url).searchParams.entries());
      await logQboAction(
        new createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
        {
          user_id,
          function_name: "qbo-callback",
          error: "Unexpected: " + (error?.message || String(error))
        }
      );
    } catch {}
    return new Response("Internal error", { status: 500 });
  }
});
