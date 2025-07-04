
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { logQboAction } from "../helpers/qbo.ts";
import { ensureQboTokens, retryWithBackoff } from "../helpers/qbo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
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

    if (!environmentVars.INTUIT_CLIENT_ID || !environmentVars.INTUIT_CLIENT_SECRET) {
      console.error('Missing required environment variables: INTUIT_CLIENT_ID and/or INTUIT_CLIENT_SECRET');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing QBO credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting project-customer sync for project:', project_id);

    // Get project with client information
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        clients(*)
      `)
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to fetch project: ${projectError?.message || 'Not found'}`);
    }

    if (!project.company_id) {
      throw new Error('Project has no associated company_id');
    }

    // Get the user_id from company_members for this project's company
    const { data: companyMember, error: memberError } = await supabase
      .from('company_members')
      .select('user_id')
      .eq('company_id', project.company_id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (memberError || !companyMember?.user_id) {
      throw new Error('No active company member found for project sync');
    }

    const userId = companyMember.user_id;

    // Find QBO connection for the user
    const { data: qboConnection, error: qboConnectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (qboConnectionError || !qboConnection) {
      throw new Error(`No QBO connection found for user: ${qboConnectionError?.message || 'Not found'}`);
    }

    // Get fresh tokens
    const tokens = await ensureQboTokens(supabase, userId, environmentVars);

    const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox.quickbooks.api.intuit.com';

    // Step 1: Ensure client exists as QBO customer
    let qboCustomerId = project.clients?.qbo_customer_id;
    
    if (!qboCustomerId && project.clients) {
      console.log('Creating QBO customer for client:', project.clients.name);
      qboCustomerId = await createQboCustomer(
        supabase,
        project.clients,
        tokens,
        qboBaseUrl,
        userId
      );
      
      // Update client with QBO customer ID
      await supabase
        .from('clients')
        .update({ qbo_customer_id: qboCustomerId })
        .eq('id', project.client_id);
    }

    // Step 2: Create QBO job for the project
    let qboJobId = project.qbo_job_id;
    
    if (!qboJobId && qboCustomerId) {
      console.log('Creating QBO job for project:', project.name);
      qboJobId = await createQboJob(
        supabase,
        project,
        qboCustomerId,
        tokens,
        qboBaseUrl,
        userId
      );
    }

    // Step 3: Update project with QBO references
    const updateData: any = {};
    if (qboCustomerId && !project.qbo_customer_id) {
      updateData.qbo_customer_id = qboCustomerId;
    }
    if (qboJobId && !project.qbo_job_id) {
      updateData.qbo_job_id = qboJobId;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project_id);
    }

    // Update sync status
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'project',
      p_entity_id: project_id,
      p_provider: 'qbo',
      p_status: 'success',
      p_provider_ref: qboJobId || qboCustomerId,
      p_provider_meta: {
        qbo_customer_id: qboCustomerId,
        qbo_job_id: qboJobId,
        operation: 'project_customer_sync'
      },
      p_user_id: userId
    });

    await logQboAction(supabase, {
      function_name: 'sync-project-customer',
      payload: { 
        project_id,
        qbo_customer_id: qboCustomerId,
        qbo_job_id: qboJobId
      },
      user_id: userId,
      severity: 'info'
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        qbo_customer_id: qboCustomerId,
        qbo_job_id: qboJobId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-project-customer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createQboCustomer(
  supabase: any,
  client: any,
  tokens: any,
  qboBaseUrl: string,
  userId: string
): Promise<string> {
  const customerData = {
    Name: client.name,
    CompanyName: client.name,
    PrimaryEmailAddr: client.email ? { Address: client.email } : undefined,
    PrimaryPhone: client.phone ? { FreeFormNumber: client.phone } : undefined,
    BillAddr: client.address ? {
      Line1: client.address,
      City: '',
      Country: 'US',
      PostalCode: ''
    } : undefined
  };

  const createCustomerOperation = async () => {
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
    return result.QueryResponse?.Customer?.[0]?.Id || result.Customer?.Id;
  };

  const retryLogger = async (attempt: number, error: Error) => {
    await logQboAction(supabase, {
      function_name: 'createQboCustomer-retry',
      payload: { client_id: client.id, attempt },
      error: `Retry attempt ${attempt}: ${error.message}`,
      user_id: userId,
      severity: 'info'
    });
  };

  return await retryWithBackoff(createCustomerOperation, 3, 100, retryLogger);
}

async function createQboJob(
  supabase: any,
  project: any,
  qboCustomerId: string,
  tokens: any,
  qboBaseUrl: string,
  userId: string
): Promise<string> {
  const jobData = {
    Name: project.name,
    ParentRef: {
      value: qboCustomerId,
      name: project.clients?.name || 'Customer'
    },
    Job: true,
    Active: true,
    Description: project.description || `Construction project: ${project.name}`,
    // Map construction project fields to QBO custom fields if needed
    CustomField: [
      {
        Name: 'Project Value',
        Type: 'StringType',
        StringValue: project.value?.toString() || '0'
      },
      {
        Name: 'Project Location',
        Type: 'StringType', 
        StringValue: project.location || ''
      },
      {
        Name: 'Start Date',
        Type: 'DateType',
        StringValue: project.start_date || ''
      },
      {
        Name: 'End Date',
        Type: 'DateType',
        StringValue: project.end_date || ''
      }
    ].filter(field => field.StringValue) // Only include non-empty fields
  };

  const createJobOperation = async () => {
    const response = await fetch(
      `${qboBaseUrl}/v3/company/${tokens.realm_id}/customer?minorversion=65`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ Customer: jobData })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create QBO job: ${errorText}`);
    }

    const result = await response.json();
    return result.QueryResponse?.Customer?.[0]?.Id || result.Customer?.Id;
  };

  const retryLogger = async (attempt: number, error: Error) => {
    await logQboAction(supabase, {
      function_name: 'createQboJob-retry',
      payload: { project_id: project.id, attempt },
      error: `Retry attempt ${attempt}: ${error.message}`,
      user_id: userId,
      severity: 'info'
    });
  };

  return await retryWithBackoff(createJobOperation, 3, 100, retryLogger);
}
