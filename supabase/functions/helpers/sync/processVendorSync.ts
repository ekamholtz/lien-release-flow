
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { createVendor as createQboVendor } from "../accounting/adapters/qboVendorAdapter.ts";
import { logQboAction } from "../qbo.ts";

export async function processVendorSync(
  supabase: ReturnType<typeof createClient>,
  vendorId: string,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  }
): Promise<{ success: boolean; error?: string; qbo_vendor_id?: string; errorType?: string }> {
  console.log('Starting vendor sync process for:', vendorId);
  
  try {
    // Get vendor data with user_id and company_id
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*, company_id')
      .eq('id', vendorId)
      .single();
    
    if (vendorError || !vendor) {
      throw new Error(`Failed to fetch vendor: ${vendorError?.message || 'Not found'}`);
    }

    if (!vendor.company_id) {
      throw new Error('Vendor has no associated company_id');
    }

    // Get the user_id from company_members for this vendor's company
    const { data: companyMember, error: memberError } = await supabase
      .from('company_members')
      .select('user_id')
      .eq('company_id', vendor.company_id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (memberError || !companyMember?.user_id) {
      throw new Error('No active company member found for vendor sync');
    }

    const userId = companyMember.user_id;

    // Mark as processing using the new upsert function with user_id
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'vendor',
      p_entity_id: vendorId,
      p_provider: 'qbo',
      p_status: 'processing',
      p_user_id: userId
    });

    console.log('Set sync status to processing for vendor:', vendorId);

    try {
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
      
      // Create vendor in QBO
      const adapter = await createQboVendor(supabase, vendor, environmentVars, qboConnection);
      
      // Record success using the new upsert function with user_id
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'vendor',
        p_entity_id: vendorId,
        p_provider: 'qbo',
        p_status: 'success',
        p_provider_ref: adapter.qboVendorId,
        p_provider_meta: adapter.providerMeta,
        p_error: null,
        p_error_message: null,
        p_user_id: userId
      });

      await logQboAction(supabase, {
        function_name: 'sync-vendor',
        payload: { 
          vendor_id: vendorId,
          qbo_vendor_id: adapter.qboVendorId,
          http_status: 200
        },
        user_id: userId,
        severity: 'info'
      });

      return { 
        success: true,
        qbo_vendor_id: adapter.qboVendorId
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
      } else if (errorMessage.includes('vendor') || errorMessage.includes('contact')) {
        errorType = 'vendor-error';
        errorMessage = `Vendor error: ${errorMessage}`;
      } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorType = 'connectivity';
        errorMessage = 'QuickBooks connectivity issue. Please try again later.';
      }
      
      // Update sync record with error using the new upsert function
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'vendor',
        p_entity_id: vendorId,
        p_provider: 'qbo',
        p_status: 'error',
        p_error: { message: errorMessage, type: errorType },
        p_error_message: errorMessage,
        p_user_id: userId
      });
      
      await logQboAction(supabase, {
        function_name: 'sync-vendor',
        payload: { vendor_id: vendorId, errorType },
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
    console.error(`Error processing vendor ${vendorId}:`, error);
    
    // Determine error type for better UI feedback
    let errorType = 'unknown';
    let errorMessage = error.message || String(error);
    
    if (error.errorType) {
      errorType = error.errorType;
    } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
      errorType = 'token-expired';
      errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
    } else if (errorMessage.includes('vendor') || errorMessage.includes('contact')) {
      errorType = 'vendor-error';
      errorMessage = `Vendor error: ${errorMessage}`;
    } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorType = 'connectivity';
      errorMessage = 'QuickBooks connectivity issue. Please try again later.';
    }
    
    // Try to get user_id for error logging
    let userId = null;
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('company_id')
        .eq('id', vendorId)
        .single();
      
      if (vendor?.company_id) {
        const { data: member } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', vendor.company_id)
          .eq('status', 'active')
          .limit(1)
          .single();
        
        userId = member?.user_id;
      }
    } catch (e) {
      console.error('Failed to get user_id for error logging:', e);
    }
    
    // Update sync record with error using the new upsert function
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'vendor',
      p_entity_id: vendorId,
      p_provider: 'qbo',
      p_status: 'error',
      p_error: { message: errorMessage, type: errorType },
      p_error_message: errorMessage,
      p_user_id: userId
    });
    
    await logQboAction(supabase, {
      function_name: 'sync-vendor',
      payload: { vendor_id: vendorId, errorType },
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
