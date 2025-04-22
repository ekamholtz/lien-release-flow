
/**
 * Helper utilities for QuickBooks Online OAuth2 + logging
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

/**
 * Upsert QBO connection info for a user/realm.
 * @param supabase Supabase admin client
 * @param userId string
 * @param realmId string
 * @param tokenData { access_token, refresh_token, scope, expires_in }
 */
export async function upsertQboConnection(
  supabase: any,
  userId: string,
  realmId: string,
  tokenData: { access_token: string, refresh_token: string, scope?: string, expires_in: number }
) {
  // Compute expires_at from expires_in
  const expires_at = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
  const payload = {
    user_id: userId,
    realm_id: realmId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    scope: tokenData.scope || "",
    expires_at,
    updated_at: new Date().toISOString()
  };

  // Try upsert on (user_id, realm_id)
  const { error } = await supabase
    .from('qbo_connections')
    .upsert(payload, { onConflict: ['user_id', 'realm_id'] });

  return error;
}

/**
 * Refresh the QBO access_token if expired, using refresh_token.
 * Returns { access_token, refresh_token, expires_in } or error.
 */
export async function refreshQboToken(
  env: { INTUIT_CLIENT_ID: string; INTUIT_CLIENT_SECRET: string; INTUIT_ENVIRONMENT: string; },
  refresh_token: string
) {
  const base = env.INTUIT_ENVIRONMENT === "production"
    ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    : "https://sandbox-accounts.platform.intuit.com/oauth2/v1/tokens/bearer";

  const basicAuth = 'Basic ' + btoa(`${env.INTUIT_CLIENT_ID}:${env.INTUIT_CLIENT_SECRET}`);

  const response = await fetch(base, {
    method: "POST",
    headers: {
      'Authorization': basicAuth,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token
    }).toString()
  });

  if (!response.ok) {
    return { error: await response.text() };
  }
  return await response.json();
}

/**
 * Log a QBO action (success/error) to qbo_logs.
 */
export async function logQboAction(
  supabase: any,
  params: { user_id?: string, function_name: string, payload?: any, error?: string }
) {
  await supabase.from('qbo_logs').insert([{
    user_id: params.user_id || null,
    function_name: params.function_name,
    payload: params.payload ? JSON.stringify(params.payload) : null,
    error: params.error || null,
    created_at: new Date().toISOString(),
  }]);
}

