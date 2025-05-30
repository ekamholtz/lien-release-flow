import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Generic retry logic with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3,
  baseDelayMs: number = 100,
  actionLogger?: (attempt: number, error: Error) => Promise<void>
): Promise<T> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authorization errors (401) as they won't succeed without a new token
      if (error.status === 401 || error.message?.includes('unauthorized')) {
        throw {
          ...error,
          retryable: false, 
          errorType: 'token-expired'
        };
      }
      
      // Server-side errors (5xx) and rate-limiting (429) are retryable
      const isRetryable = error.status >= 500 || error.status === 429 || error.status === 0 || 
                        error.message?.includes('sending request') || 
                        error.message?.includes('network');
      
      if (!isRetryable) {
        throw {
          ...error,
          retryable: false,
          errorType: 'customer-error'
        };
      }

      // Log the retry attempt if a logger is provided
      if (actionLogger) {
        await actionLogger(attempt, error);
      }

      attempt++;
      if (attempt >= maxRetries) {
        throw {
          ...error,
          retryable: false,
          errorType: 'max-retries-exceeded',
          attempts: attempt
        };
      }

      // Exponential backoff with base*2^attempt (100ms, 200ms, 400ms, etc)
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // This should never happen due to the throw in the loop, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error');
}

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

  // Logger for retry attempts
  const retryLogger = async (attempt: number, error: Error) => {
    await logQboAction(supabase, {
      function_name: 'getOrCreateCustomer-retry',
      payload: { 
        user_id, 
        external_id, 
        display_name,
        attempt,
        status: error.status || 'unknown'
      },
      error: `Retry attempt ${attempt}: ${error.message}`,
      user_id,
      severity: 'info'
    });
  };

  // If not in cache, check if customer exists in QBO with retry logic
  const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox.quickbooks.api.intuit.com';

  try {
    // Search for customer in QBO with retry logic
    const searchCustomer = async () => {
      const qboQueryUrl = `${qboBaseUrl}/v3/company/${realm_id}/query?query=select * from Customer where FullyQualifiedName = '${display_name}'&minorversion=65`;
      
      const qboCustomerSearchResponse = await fetch(qboQueryUrl, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      });

      if (!qboCustomerSearchResponse.ok) {
        const errorText = await qboCustomerSearchResponse.text();
        throw {
          status: qboCustomerSearchResponse.status,
          message: `Failed to search for customer in QBO: ${errorText}`,
          originalResponse: errorText
        };
      }

      return await qboCustomerSearchResponse.json();
    };

    // Use the retry logic for the search operation
    const qboCustomerSearchData = await retryWithBackoff(searchCustomer, 3, 100, retryLogger);

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

    // If not found, create the customer with retry logic
    const createCustomer = async () => {
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
            Address: email || 'noemail@example.com'
          }
        })
      });

      if (!qboCustomerCreateResponse.ok) {
        const errorText = await qboCustomerCreateResponse.text();
        throw {
          status: qboCustomerCreateResponse.status,
          message: `Failed to create customer in QBO: ${errorText}`,
          originalResponse: errorText
        };
      }

      return await qboCustomerCreateResponse.json();
    };

    // Use the retry logic for the create operation
    const qboCustomerCreateData = await retryWithBackoff(createCustomer, 3, 100, retryLogger);
    
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
  } catch (error) {
    // Log the error
    await logQboAction(supabase, {
      function_name: 'getOrCreateCustomer',
      payload: { user_id, external_id, display_name },
      error: `Failed to create or find customer: ${error.message || JSON.stringify(error)}`,
      user_id,
      severity: 'error'
    });

    // Classify error for better UI messaging
    if (error.errorType === 'token-expired') {
      throw new Error('QBO authorization expired. Please reconnect your QBO account.');
    } else if (error.errorType === 'max-retries-exceeded') {
      throw new Error('QuickBooks connectivity issue: Unable to reach QuickBooks servers after multiple attempts. Please try again later.');
    } else {
      throw new Error('QuickBooks connectivity issue: Unable to create or find the customer in QuickBooks. Please try again later.');
    }
  }
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
        user_id,
        severity
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

    // Check if tokens need to be refreshed (expire in next 2 minutes or already expired)
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);
    
    // Only refresh if there's a valid expiration date
    const needsRefresh = !isNaN(expiresAt.getTime()) && expiresAt <= twoMinutesFromNow;
    
    if (needsRefresh) {
      console.log('QBO tokens expired or will expire soon, refreshing...');
      
      // Refresh the tokens
      const tokenEndpoint = environmentVars.INTUIT_ENVIRONMENT === 'production'
        ? 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
        : 'https://oauth.sandbox.intuit.com/oauth2/v1/tokens/bearer';
      
      try {  
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
          
          // If refresh fails due to an invalid token, delete the connection so UI can prompt re-auth
          if (response.status === 401) {
            await supabase
              .from('qbo_connections')
              .delete()
              .eq('user_id', user_id)
              .eq('realm_id', tokens.realm_id);
              
            await logQboAction(supabase, {
              user_id,
              function_name: "ensureQboTokens",
              error: `Authentication expired - deleted connection record: ${response.status} ${errorText}`,
              severity: 'error'
            });
            
            throw {
              message: 'QuickBooks authentication expired. Please reconnect your account.',
              errorType: 'token-expired'
            };
          }
          
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
      } catch (refreshError) {
        // For network errors or other non-auth issues, log but don't delete connection
        if (refreshError.errorType !== 'token-expired') {
          await logQboAction(supabase, {
            user_id,
            function_name: "ensureQboTokens",
            error: `Error refreshing tokens: ${refreshError.message || String(refreshError)}`
          });
        }
        throw refreshError;
      }
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
