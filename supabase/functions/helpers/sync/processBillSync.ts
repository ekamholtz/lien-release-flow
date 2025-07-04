
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { createBill as createQboBill } from "../accounting/adapters/qboBillAdapter.ts";
import { logQboAction } from "../qbo.ts";

export async function processBillSync(
  supabase: ReturnType<typeof createClient>,
  billId: string,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  }
): Promise<{ success: boolean; error?: string; qbo_bill_id?: string; errorType?: string }> {
  console.log('Starting bill sync process for:', billId);
  
  try {
    // Get bill data with related information
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select(`
        *,
        vendors(id, name, qbo_vendor_id),
        projects(id, name, qbo_customer_id),
        bill_line_items(
          id,
          amount,
          description,
          billable,
          category_id,
          expense_categories(id, name)
        )
      `)
      .eq('id', billId)
      .single();
    
    if (billError || !bill) {
      throw new Error(`Failed to fetch bill: ${billError?.message || 'Not found'}`);
    }

    if (!bill.company_id) {
      throw new Error('Bill has no associated company_id');
    }

    // Get the user_id from company_members for this bill's company
    const { data: companyMember, error: memberError } = await supabase
      .from('company_members')
      .select('user_id')
      .eq('company_id', bill.company_id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (memberError || !companyMember?.user_id) {
      throw new Error('No active company member found for bill sync');
    }

    const userId = companyMember.user_id;

    // Mark as processing using the sync status function with user_id
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'bill',
      p_entity_id: billId,
      p_provider: 'qbo',
      p_status: 'processing',
      p_user_id: userId
    });

    console.log('Set sync status to processing for bill:', billId);

    try {
      // Check if vendor exists in QBO first (dependency management)
      if (!bill.vendors?.qbo_vendor_id) {
        console.log('Vendor not synced to QBO, syncing vendor first...');
        
        // Trigger vendor sync first
        const vendorSyncResponse = await fetch(
          'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-vendor',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ vendor_id: bill.vendor_id })
          }
        );
        
        const vendorSyncResult = await vendorSyncResponse.json();
        
        if (!vendorSyncResult.success) {
          throw new Error(`Failed to sync vendor: ${vendorSyncResult.error || 'Unknown error'}`);
        }
        
        // Update bill with vendor QBO ID
        bill.vendors.qbo_vendor_id = vendorSyncResult.qbo_vendor_id;
      }

      // Find QBO connection for the company
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
      
      // Create bill in QBO
      const adapter = await createQboBill(supabase, bill, environmentVars, qboConnection);
      
      // Record success using the sync status function with user_id
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'bill',
        p_entity_id: billId,
        p_provider: 'qbo',
        p_status: 'success',
        p_provider_ref: adapter.qboBillId,
        p_provider_meta: adapter.providerMeta,
        p_error: null,
        p_error_message: null,
        p_user_id: userId
      });

      await logQboAction(supabase, {
        function_name: 'sync-bill',
        payload: { 
          bill_id: billId,
          qbo_bill_id: adapter.qboBillId,
          http_status: 200
        },
        user_id: userId,
        severity: 'info'
      });

      return { 
        success: true,
        qbo_bill_id: adapter.qboBillId
      };
    } catch (syncError) {
      // Classify the error type
      let errorType = 'unknown';
      let errorMessage = syncError.message || String(syncError);
      
      if (syncError.errorType) {
        errorType = syncError.errorType;
      } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
        errorType = 'token-expired';
        errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
      } else if (errorMessage.includes('bill') || errorMessage.includes('vendor')) {
        errorType = 'bill-error';
        errorMessage = `Bill error: ${errorMessage}`;
      } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorType = 'connectivity';
        errorMessage = 'QuickBooks connectivity issue. Please try again later.';
      }
      
      // Update sync record with error using the sync status function
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'bill',
        p_entity_id: billId,
        p_provider: 'qbo',
        p_status: 'error',
        p_error: { message: errorMessage, type: errorType },
        p_error_message: errorMessage,
        p_user_id: userId
      });
      
      await logQboAction(supabase, {
        function_name: 'sync-bill',
        payload: { bill_id: billId, errorType },
        error: errorMessage,
        user_id: userId,
        severity: 'error'
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errorType 
      };
    }
    
  } catch (error) {
    console.error(`Error processing bill ${billId}:`, error);
    
    // Determine error type for better UI feedback
    let errorType = 'unknown';
    let errorMessage = error.message || String(error);
    
    if (error.errorType) {
      errorType = error.errorType;
    } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
      errorType = 'token-expired';
      errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
    } else if (errorMessage.includes('bill') || errorMessage.includes('vendor')) {
      errorType = 'bill-error';
      errorMessage = `Bill error: ${errorMessage}`;
    } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorType = 'connectivity';
      errorMessage = 'QuickBooks connectivity issue. Please try again later.';
    }
    
    // Try to get user_id for error logging
    let userId = null;
    try {
      const { data: bill } = await supabase
        .from('bills')
        .select('company_id')
        .eq('id', billId)
        .single();
      
      if (bill?.company_id) {
        const { data: member } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', bill.company_id)
          .eq('status', 'active')
          .limit(1)
          .single();
        
        userId = member?.user_id;
      }
    } catch (e) {
      console.error('Failed to get user_id for error logging:', e);
    }
    
    // Update sync record with error using the sync status function
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'bill',
      p_entity_id: billId,
      p_provider: 'qbo',
      p_status: 'error',
      p_error: { message: errorMessage, type: errorType },
      p_error_message: errorMessage,
      p_user_id: userId
    });
    
    await logQboAction(supabase, {
      function_name: 'sync-bill',
      payload: { bill_id: billId, errorType },
      error: errorMessage,
      user_id: userId,
      severity: 'error'
    });
    
    return { 
      success: false, 
      error: errorMessage,
      errorType 
    };
  }
}
