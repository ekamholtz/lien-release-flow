
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface TriggerSyncRequest {
  companyId: string;
  entityType: string; // 'invoice', 'bill', 'vendor', 'client', 'payment', 'project', 'all'
  batchSize?: number;
}

interface SyncResult {
  entityType: string;
  queued: number;
  error?: string;
}

serve(async (req) => {
  console.log('Starting trigger-entity-sync function');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { companyId, entityType, batchSize = 50 }: TriggerSyncRequest = await req.json();
    
    console.log('Trigger sync request:', { companyId, entityType, batchSize });

    // Verify company exists and has QBO connection
    const { data: connection, error: connectionError } = await supabase
      .from('qbo_connections')
      .select('id, user_id')
      .eq('user_id', companyId) // Assuming companyId maps to user_id for now
      .single();

    if (connectionError || !connection) {
      console.error('QBO connection check failed:', connectionError);
      return new Response(
        JSON.stringify({ error: 'QBO connection not found or disconnected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let syncResults: SyncResult[] = [];

    if (entityType === 'all') {
      // Trigger sync for all entity types in dependency order
      syncResults = await triggerBulkSync(companyId, batchSize, supabase);
    } else {
      // Trigger sync for specific entity type
      const result = await triggerEntityTypeSync(companyId, entityType, batchSize, supabase);
      syncResults = result;
    }

    // Log the manual sync trigger
    await supabase.from('qbo_logs').insert({
      user_id: connection.user_id,
      function_name: 'trigger-entity-sync',
      payload: { entityType, batchSize, companyId },
      created_at: new Date().toISOString()
    });

    const totalQueued = syncResults.reduce((sum, r) => sum + r.queued, 0);

    console.log('Sync trigger completed:', { entityType, totalQueued, results: syncResults });

    return new Response(JSON.stringify({
      success: true,
      entityType,
      results: syncResults,
      totalQueued
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Manual sync trigger error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function triggerBulkSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult[]> {
  // Process in dependency order: vendors/clients → projects → bills/invoices → payments
  const entityTypes = ['vendor', 'client', 'project', 'bill', 'invoice', 'payment'];
  const results: SyncResult[] = [];

  for (const entityType of entityTypes) {
    try {
      const result = await triggerEntityTypeSync(companyId, entityType, batchSize, supabase);
      results.push(...result);
    } catch (error) {
      console.error(`Error triggering ${entityType} sync:`, error);
      results.push({ entityType, queued: 0, error: error.message });
    }
  }

  return results;
}

async function triggerEntityTypeSync(companyId: string, entityType: string, batchSize: number, supabase: any): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  switch (entityType) {
    case 'vendor':
      results.push(await queueVendorSync(companyId, batchSize, supabase));
      break;
    case 'client':
      results.push(await queueClientSync(companyId, batchSize, supabase));
      break;
    case 'project':
      results.push(await queueProjectSync(companyId, batchSize, supabase));
      break;
    case 'bill':
      results.push(await queueBillSync(companyId, batchSize, supabase));
      break;
    case 'invoice':
      results.push(await queueInvoiceSync(companyId, batchSize, supabase));
      break;
    case 'payment':
      results.push(await queuePaymentSync(companyId, batchSize, supabase));
      break;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }

  return results;
}

async function queueVendorSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult> {
  // Get vendors that need sync (no qbo_vendor_id)
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id')
    .eq('company_id', companyId)
    .is('qbo_vendor_id', null)
    .limit(batchSize);

  if (error) {
    console.error('Error fetching vendors for sync:', error);
    return { entityType: 'vendor', queued: 0, error: error.message };
  }

  // Queue each vendor for sync
  for (const vendor of vendors || []) {
    await supabase.from('accounting_sync').insert({
      company_id: companyId,
      entity_type: 'vendor',
      entity_id: vendor.id,
      provider: 'qbo',
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return { entityType: 'vendor', queued: vendors?.length || 0 };
}

async function queueClientSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult> {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', companyId)
    .is('qbo_customer_id', null)
    .limit(batchSize);

  if (error) {
    console.error('Error fetching clients for sync:', error);
    return { entityType: 'client', queued: 0, error: error.message };
  }

  for (const client of clients || []) {
    await supabase.from('accounting_sync').insert({
      company_id: companyId,
      entity_type: 'client',
      entity_id: client.id,
      provider: 'qbo',
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return { entityType: 'client', queued: clients?.length || 0 };
}

async function queueProjectSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id')
    .eq('company_id', companyId)
    .is('qbo_customer_id', null)
    .limit(batchSize);

  if (error) {
    console.error('Error fetching projects for sync:', error);
    return { entityType: 'project', queued: 0, error: error.message };
  }

  for (const project of projects || []) {
    await supabase.from('accounting_sync').insert({
      company_id: companyId,
      entity_type: 'project',
      entity_id: project.id,
      provider: 'qbo',
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return { entityType: 'project', queued: projects?.length || 0 };
}

async function queueBillSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult> {
  const { data: bills, error } = await supabase
    .from('bills')
    .select('id')
    .eq('company_id', companyId)
    .is('qbo_bill_id', null)
    .limit(batchSize);

  if (error) {
    console.error('Error fetching bills for sync:', error);
    return { entityType: 'bill', queued: 0, error: error.message };
  }

  for (const bill of bills || []) {
    await supabase.from('accounting_sync').insert({
      company_id: companyId,
      entity_type: 'bill',
      entity_id: bill.id,
      provider: 'qbo',
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return { entityType: 'bill', queued: bills?.length || 0 };
}

async function queueInvoiceSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('company_id', companyId)
    .is('qbo_invoice_id', null)
    .limit(batchSize);

  if (error) {
    console.error('Error fetching invoices for sync:', error);
    return { entityType: 'invoice', queued: 0, error: error.message };
  }

  for (const invoice of invoices || []) {
    await supabase.from('accounting_sync').insert({
      company_id: companyId,
      entity_type: 'invoice',
      entity_id: invoice.id,
      provider: 'qbo',
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return { entityType: 'invoice', queued: invoices?.length || 0 };
}

async function queuePaymentSync(companyId: string, batchSize: number, supabase: any): Promise<SyncResult> {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id')
    .eq('company_id', companyId)
    .is('qbo_payment_id', null)
    .limit(batchSize);

  if (error) {
    console.error('Error fetching payments for sync:', error);
    return { entityType: 'payment', queued: 0, error: error.message };
  }

  for (const payment of payments || []) {
    await supabase.from('accounting_sync').insert({
      company_id: companyId,
      entity_type: 'payment',
      entity_id: payment.id,
      provider: 'qbo',
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return { entityType: 'payment', queued: payments?.length || 0 };
}
