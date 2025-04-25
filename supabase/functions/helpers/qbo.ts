
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

export async function upsertQboConnection(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  realm_id: string,
  access_token: string,
  refresh_token: string,
  expires_in: number,
  scope?: string
) {
  // Calculate expires_at safely to avoid invalid time value errors
  let expires_at;
  try {
    // Create a new Date object, add the expires_in seconds
    const now = new Date();
    expires_at = new Date(now.getTime() + (expires_in * 1000));
    
    // Validate the date is valid before proceeding
    if (isNaN(expires_at.getTime())) {
      console.warn('Invalid expires_at date calculated, using default expiration');
      // Use a default expiration of 55 minutes from now as fallback
      expires_at = new Date(now.getTime() + (55 * 60 * 1000));
    }
  } catch (error) {
    console.warn('Error calculating expires_at:', error);
    // Fallback to a simple timestamp 55 minutes from now
    expires_at = new Date(Date.now() + (55 * 60 * 1000));
  }
  
  console.log('Upserting QBO connection with values:', {
    user_id,
    realm_id,
    access_token: access_token ? '***' : 'missing',
    refresh_token: refresh_token ? '***' : 'missing',
    expires_at: expires_at.toISOString(),
    scope: scope || 'default'
  });
  
  if (!refresh_token) {
    throw new Error('Missing refresh_token - cannot proceed with connection');
  }
  
  const { data, error } = await supabase
    .from('qbo_connections')
    .upsert({
      user_id,
      realm_id,
      access_token,
      refresh_token,
      expires_at: expires_at.toISOString(),
      scope
    }, {
      onConflict: 'user_id,realm_id',
      returning: 'minimal'
    });
    
  if (error) {
    console.error('Error upserting QBO connection:', error);
    throw error;
  }
  
  return true;
}

export async function getOrCreateCustomer(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  customer: {
    external_id: string;
    display_name: string;
    email: string;
  },
  tokens: {
    access_token: string;
    refresh_token: string;
    realm_id: string;
  },
  environmentVars: {
    INTUIT_ENVIRONMENT: string;
  }
) {
  const { access_token, realm_id } = tokens;
  const { external_id, display_name, email } = customer;

  // Check if customer exists in cache
  const { data: cachedCustomer, error: cacheError } = await supabase
    .from('qbo_contacts_cache')
    .select('qbo_id')
    .eq('user_id', user_id)
    .eq('contact_type', 'customer')
    .eq('external_id', external_id)
    .single();

  if (cacheError && cacheError.code !== 'PGRST116') {
    console.error('Error checking customer cache:', cacheError);
    throw cacheError;
  }

  if (cachedCustomer?.qbo_id) {
    console.log(`Customer ${external_id} found in cache with QBO ID ${cachedCustomer.qbo_id}`);
    return cachedCustomer.qbo_id;
  }

  // If not in cache, check if customer exists in QBO
  const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox.quickbooks.api.intuit.com';
  const qboQueryUrl = `${qboBaseUrl}/v3/company/${realm_id}/query?query=select * from Customer where FullyQualifiedName = '${display_name}'&minorversion=65`;

  const qboCustomerSearchResponse = await fetch(qboQueryUrl, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  });

  if (!qboCustomerSearchResponse.ok) {
    console.error('Error searching for customer in QBO:', qboCustomerSearchResponse.status, await qboCustomerSearchResponse.text());
    throw new Error(`Failed to search for customer in QBO: ${qboCustomerSearchResponse.status}`);
  }

  const qboCustomerSearchData = await qboCustomerSearchResponse.json();

  if (qboCustomerSearchData.QueryResponse?.Customer?.length > 0) {
    const existingQboCustomerId = qboCustomerSearchData.QueryResponse.Customer[0].Id;
    console.log(`Customer ${display_name} found in QBO with ID ${existingQboCustomerId}`);

    // Cache the found customer
    await supabase
      .from('qbo_contacts_cache')
      .insert({
        user_id: user_id,
        contact_type: 'customer',
        external_id: external_id,
        qbo_id: existingQboCustomerId,
        data: qboCustomerSearchData.QueryResponse.Customer[0]
      });

    return existingQboCustomerId;
  }

  // If not in QBO, create the customer
  const qboCreateUrl = `${qboBaseUrl}/v3/company/${realm_id}/customer?minorversion=65`;
  const qboCustomerCreateResponse = await fetch(qboCreateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      DisplayName: display_name,
      FullyQualifiedName: display_name,
      PrimaryEmailAddr: {
        Address: email
      }
    })
  });

  if (!qboCustomerCreateResponse.ok) {
    console.error('Error creating customer in QBO:', qboCustomerCreateResponse.status, await qboCustomerCreateResponse.text());
    throw new Error(`Failed to create customer in QBO: ${qboCustomerCreateResponse.status}`);
  }

  const qboCustomerCreateData = await qboCustomerCreateResponse.json();
  const newQboCustomerId = qboCustomerCreateData.Customer.Id;
  console.log(`Customer ${display_name} created in QBO with ID ${newQboCustomerId}`);

  // Cache the new customer
  await supabase
    .from('qbo_contacts_cache')
    .insert({
      user_id: user_id,
      contact_type: 'customer',
      external_id: external_id,
      qbo_id: newQboCustomerId,
      data: qboCustomerCreateData.Customer
    });

  return newQboCustomerId;
}

export function mapInvoiceToQbo(invoice: any, qboCustomerId: string) {
  return {
    CustomerRef: {
      value: qboCustomerId
    },
    Line: invoice.line_items.map((item: any) => ({
      Description: item.description,
      Amount: item.amount,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        UnitPrice: item.amount,
        Qty: 1,
        ItemRef: {
          name: "Services", // Replace with actual item name if needed
          value: "1" // Replace with actual item ID if needed
        }
      }
    })),
    DueDate: invoice.due_date,
    TotalAmt: invoice.amount,
    CustomField: [
      {
        DefinitionId: "1",
        Name: "InvoiceId",
        Type: "StringType",
        StringValue: invoice.id
      }
    ]
  };
}

export async function batchCreateInQbo(
  entities: any[],
  entityType: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    realm_id: string;
  },
  environmentVars: {
    INTUIT_ENVIRONMENT: string;
  }
) {
  const { access_token, realm_id } = tokens;
  const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox.quickbooks.api.intuit.com';
  const qboBatchUrl = `${qboBaseUrl}/v3/company/${realm_id}/batch?minorversion=65`;

  const batchRequestBody = {
    BatchItemRequest: entities.map((entity, index) => ({
      bId: String(index + 1),
      operation: 'create',
      body: entity,
      IntuitObject: entityType
    }))
  };

  const qboBatchResponse = await fetch(qboBatchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(batchRequestBody)
  });

  if (!qboBatchResponse.ok) {
    console.error('Error creating batch in QBO:', qboBatchResponse.status, await qboBatchResponse.text());
    throw new Error(`Failed to create batch in QBO: ${qboBatchResponse.status}`);
  }

  const qboBatchData = await qboBatchResponse.json();

  return qboBatchData.BatchItemResponse.map((item: any) => {
    if (item.Fault) {
      console.error(`Error creating ${entityType} in QBO:`, item.Fault);
      return { [entityType]: null, error: item.Fault };
    }
    return { [entityType]: item.IntuitObject };
  });
}

export async function logQboAction(
  supabase: ReturnType<typeof createClient>,
  {
    function_name,
    payload = null,
    error = null,
    user_id = null,
    severity = 'info'
  }: {
    function_name: string;
    payload?: any;
    error?: string | null;
    user_id?: string | null;
    severity?: 'info' | 'error';
  }
) {
  try {
    await supabase
      .from('qbo_logs')
      .insert({
        function_name,
        payload,
        error,
        user_id
      });
  } catch (err) {
    console.error('Failed to log QBO action:', err);
  }
}

export async function ensureQboTokens(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  },
) {
  try {
    console.log(`Ensuring QBO tokens for user ${user_id}`);
    
    // Get the user's QBO tokens
    const { data: tokens, error } = await supabase
      .from('qbo_connections')
      .select('access_token, refresh_token, expires_at, realm_id')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(`No QuickBooks connection found for user ${user_id}:`, error);
      throw new Error(`No QuickBooks connection found for user ${user_id}`);
    }

    if (!tokens.refresh_token) {
      console.error(`Missing refresh token for user ${user_id}`);
      throw new Error('Missing refresh token for QuickBooks connection');
    }

    // Check if tokens need to be refreshed (expire in next 5 minutes or already expired)
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // Only refresh if there's a valid expiration date
    if (!isNaN(expiresAt.getTime()) && expiresAt < fiveMinutesFromNow) {
      console.log('QBO tokens expired or will expire soon, refreshing...');
      
      // Refresh the tokens
      const tokenEndpoint = environmentVars.INTUIT_ENVIRONMENT === 'production'
        ? 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
        : 'https://oauth.sandbox.intuit.com/oauth2/v1/tokens/bearer';
        
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${environmentVars.INTUIT_CLIENT_ID}:${environmentVars.INTUIT_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          'grant_type': 'refresh_token',
          'refresh_token': tokens.refresh_token
        }).toString()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to refresh QBO tokens: ${response.status} ${errorText}`);
        await logQboAction(supabase, {
          user_id,
          function_name: "ensureQboTokens",
          error: `Failed to refresh QBO tokens: ${response.status} ${errorText}`
        });
        throw new Error(`Failed to refresh QBO tokens: ${response.status} ${errorText}`);
      }
      
      const refreshData = await response.json();
      
      // Update tokens in database
      await upsertQboConnection(
        supabase,
        user_id,
        tokens.realm_id,
        refreshData.access_token,
        refreshData.refresh_token || tokens.refresh_token, // Use new refresh token if provided, otherwise keep the old one
        refreshData.expires_in || 3600,
        refreshData.scope
      );
      
      // Return the new tokens
      return {
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || tokens.refresh_token,
        realm_id: tokens.realm_id
      };
    }
    
    // Tokens still valid, return them
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      realm_id: tokens.realm_id
    };
  } catch (error) {
    console.error('Error ensuring QBO tokens:', error);
    await logQboAction(supabase, {
      user_id,
      function_name: "ensureQboTokens",
      error: `Error ensuring QBO tokens: ${error.message || String(error)}`
    });
    throw error;
  }
}
