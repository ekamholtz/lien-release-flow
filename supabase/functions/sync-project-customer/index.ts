
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { ensureQboTokens, logQboAction, retryWithBackoff } from "../helpers/qbo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log('Starting sync-project-customer function');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const environmentVars = {
      INTUIT_CLIENT_ID: Deno.env.get('INTUIT_CLIENT_ID')!,
      INTUIT_CLIENT_SECRET: Deno.env.get('INTUIT_CLIENT_SECRET')!,
      INTUIT_ENVIRONMENT: Deno.env.get('INTUIT_ENVIRONMENT') || 'sandbox'
    };

    // Verify required environment variables
    if (!environmentVars.INTUIT_CLIENT_ID || !environmentVars.INTUIT_CLIENT_SECRET) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing QBO credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the JWT and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Received request data:', requestData);
    
    const { client_id, client_name, client_email, company_id } = requestData;
    
    if (!client_name || !company_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: client_name, company_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify user has access to this company
    const { data: companyMember } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('status', 'active')
      .single();
    
    if (!companyMember) {
      return new Response(
        JSON.stringify({ error: 'Access denied to company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get fresh tokens for QBO API
    const tokens = await ensureQboTokens(supabase, user.id, environmentVars);
    
    const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox.quickbooks.api.intuit.com';
    
    // Check if customer already exists in QBO
    let qboCustomerId = null;
    
    if (client_id) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('qbo_customer_id')
        .eq('id', client_id)
        .eq('company_id', company_id)
        .single();
      
      if (existingClient?.qbo_customer_id) {
        console.log('Customer already exists in QBO:', existingClient.qbo_customer_id);
        return new Response(
          JSON.stringify({ 
            success: true,
            qbo_customer_id: existingClient.qbo_customer_id,
            message: 'Customer already synced'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Search for existing customer in QBO by name
    const searchOperation = async () => {
      const searchUrl = `${qboBaseUrl}/v3/company/${tokens.realm_id}/query?query=SELECT * FROM Customer WHERE Name = '${client_name.replace(/'/g, "\\'")}'&minorversion=65`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to search QBO customers: ${errorText}`);
      }
      
      return await response.json();
    };
    
    const retryLogger = async (attempt: number, error: Error) => {
      await logQboAction(supabase, {
        function_name: 'sync-project-customer-search-retry',
        payload: { client_name, attempt },
        error: `Retry attempt ${attempt}: ${error.message}`,
        user_id: user.id,
        severity: 'info'
      });
    };
    
    try {
      const searchResult = await retryWithBackoff(searchOperation, 3, 100, retryLogger);
      
      if (searchResult.QueryResponse?.Customer?.length > 0) {
        qboCustomerId = searchResult.QueryResponse.Customer[0].Id;
        console.log('Found existing QBO customer:', qboCustomerId);
      }
    } catch (searchError) {
      console.log('Customer search failed, will create new:', searchError.message);
    }
    
    // If customer doesn't exist, create it
    if (!qboCustomerId) {
      console.log('Creating new QBO customer');
      
      const customerData = {
        Name: client_name,
        CompanyName: client_name,
        PrimaryEmailAddr: {
          Address: client_email || 'noemail@example.com'
        }
      };
      
      const createOperation = async () => {
        const response = await fetch(
          `${qboBaseUrl}/v3/company/${tokens.realm_id}/customer?minorversion=65`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ Customer: customerData })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create QBO customer: ${errorText}`);
        }

        const result = await response.json();
        return result.QueryResponse?.Customer?.[0] || result.Customer;
      };

      const createRetryLogger = async (attempt: number, error: Error) => {
        await logQboAction(supabase, {
          function_name: 'sync-project-customer-create-retry',
          payload: { client_name, client_email, attempt },
          error: `Retry attempt ${attempt}: ${error.message}`,
          user_id: user.id,
          severity: 'info'
        });
      };

      const qboCustomer = await retryWithBackoff(createOperation, 3, 100, createRetryLogger);
      
      if (!qboCustomer?.Id) {
        throw new Error('QBO customer creation returned no ID');
      }
      
      qboCustomerId = qboCustomer.Id;
      console.log('Created QBO customer with ID:', qboCustomerId);
    }
    
    // Update client record with QBO customer ID if we have a client_id
    if (client_id && qboCustomerId) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ qbo_customer_id: qboCustomerId })
        .eq('id', client_id)
        .eq('company_id', company_id);
      
      if (updateError) {
        console.error('Error updating client with QBO customer ID:', updateError);
        // Don't fail the entire operation for this
      }
    }
    
    await logQboAction(supabase, {
      function_name: 'sync-project-customer',
      payload: { 
        client_id,
        client_name,
        qbo_customer_id: qboCustomerId,
        company_id
      },
      user_id: user.id,
      severity: 'info'
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        qbo_customer_id: qboCustomerId,
        message: 'Customer synced successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-project-customer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.errorType || 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
