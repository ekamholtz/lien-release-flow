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

/**
 * Ensure QBO tokens are valid, refresh if needed
 */
export async function ensureQboTokens(
  supabase: any,
  userId: string,
  env: { INTUIT_CLIENT_ID: string; INTUIT_CLIENT_SECRET: string; INTUIT_ENVIRONMENT: string }
) {
  // Get current connection
  const { data: connections } = await supabase
    .from('qbo_connections')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (!connections?.length) {
    throw new Error('No QBO connection found');
  }

  const connection = connections[0];
  const now = new Date();
  const expiresAt = new Date(connection.expires_at);

  // Check if token needs refresh (within 5 minutes of expiry)
  if (expiresAt.getTime() - now.getTime() <= 300000) {
    const tokens = await refreshQboToken(env, connection.refresh_token);
    if (tokens.error) {
      throw new Error(`Token refresh failed: ${tokens.error}`);
    }

    await upsertQboConnection(supabase, userId, connection.realm_id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      expires_in: tokens.expires_in
    });

    return { 
      access_token: tokens.access_token, 
      realm_id: connection.realm_id 
    };
  }

  return { 
    access_token: connection.access_token, 
    realm_id: connection.realm_id 
  };
}

/**
 * Get or create a customer in QBO, with caching
 */
export async function getOrCreateCustomer(
  supabase: any,
  userId: string,
  customerData: {
    external_id: string;
    display_name: string;
    email?: string;
  },
  tokens: { access_token: string; realm_id: string },
  env: { INTUIT_ENVIRONMENT: string }
) {
  // Check cache first
  const { data: cached } = await supabase
    .from('qbo_contacts_cache')
    .select('qbo_id')
    .match({ 
      user_id: userId, 
      external_id: customerData.external_id,
      contact_type: 'customer'
    })
    .single();

  if (cached?.qbo_id) {
    return cached.qbo_id;
  }

  const apiBase = env.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  // Search for existing customer
  const searchResp = await fetch(
    `${apiBase}/v3/company/${tokens.realm_id}/query?query=` + 
    encodeURIComponent(`select * from Customer where DisplayName = '${customerData.display_name}'`),
    {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    }
  );

  if (!searchResp.ok) {
    throw new Error(`Customer search failed: ${await searchResp.text()}`);
  }

  const searchData = await searchResp.json();
  let qboId;

  if (searchData.QueryResponse.Customer?.length) {
    qboId = searchData.QueryResponse.Customer[0].Id;
  } else {
    // Create new customer
    const createResp = await fetch(
      `${apiBase}/v3/company/${tokens.realm_id}/customer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          DisplayName: customerData.display_name,
          PrimaryEmailAddr: customerData.email ? { Address: customerData.email } : undefined
        })
      }
    );

    if (!createResp.ok) {
      throw new Error(`Customer creation failed: ${await createResp.text()}`);
    }

    const createData = await createResp.json();
    qboId = createData.Customer.Id;
  }

  // Cache the result
  await supabase
    .from('qbo_contacts_cache')
    .insert({
      user_id: userId,
      external_id: customerData.external_id,
      qbo_id: qboId,
      contact_type: 'customer',
      data: customerData
    });

  return qboId;
}
