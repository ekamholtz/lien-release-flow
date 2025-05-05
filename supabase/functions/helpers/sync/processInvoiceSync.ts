
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { createInvoice as createQboInvoice } from "../accounting/adapters/qboInvoiceAdapter.ts";
import { logQboAction } from "../qbo.ts";

export async function processInvoiceSync(
  supabase: ReturnType<typeof createClient>,
  invoiceId: string,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  }
): Promise<{ success: boolean; error?: string; qbo_invoice_id?: string; errorType?: string }> {
  console.log('Starting invoice sync process for:', invoiceId);
  
  try {
    // Get invoice data with user_id
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, projects(*), user_id, company_id')
      .eq('id', invoiceId)
      .single();
    
    if (invoiceError || !invoice) {
      throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Not found'}`);
    }

    if (!invoice.user_id) {
      throw new Error('Invoice has no associated user_id');
    }

    if (!invoice.company_id) {
      throw new Error('Invoice has no associated company_id');
    }

    // Mark as processing using the new upsert function with user_id
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_provider: 'qbo',
      p_status: 'processing',
      p_user_id: invoice.user_id
    });

    console.log('Set sync status to processing for invoice:', invoiceId);

    try {
      // Find QBO connection for the company
      const { data: qboConnection, error: qboConnectionError } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('company_id', invoice.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (qboConnectionError || !qboConnection) {
        throw new Error(`No QBO connection found for company: ${qboConnectionError?.message || 'Not found'}`);
      }
      
      // Create invoice in QBO
      const adapter = await createQboInvoice(supabase, invoice, environmentVars, qboConnection);
      
      // Record success using the new upsert function with user_id
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'invoice',
        p_entity_id: invoiceId,
        p_provider: 'qbo',
        p_status: 'success',
        p_provider_ref: adapter.qboInvoiceId,
        p_provider_meta: adapter.providerMeta,
        p_error: null,
        p_error_message: null,
        p_user_id: invoice.user_id
      });

      await logQboAction(supabase, {
        function_name: 'sync-invoice',
        payload: { 
          invoice_id: invoiceId,
          qbo_invoice_id: adapter.qboInvoiceId,
          http_status: 200
        },
        user_id: invoice.user_id,
        severity: 'info'
      });

      return { 
        success: true,
        qbo_invoice_id: adapter.qboInvoiceId
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
      } else if (errorMessage.includes('customer') || errorMessage.includes('contact')) {
        errorType = 'customer-error';
        errorMessage = `Customer error: ${errorMessage}`;
      } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorType = 'connectivity';
        errorMessage = 'QuickBooks connectivity issue. Please try again later.';
      }
      
      // Update sync record with error using the new upsert function
      await supabase.rpc('update_sync_status', {
        p_entity_type: 'invoice',
        p_entity_id: invoiceId,
        p_provider: 'qbo',
        p_status: 'error',
        p_error: { message: errorMessage, type: errorType },
        p_error_message: errorMessage,
        p_user_id: invoice.user_id
      });
      
      await logQboAction(supabase, {
        function_name: 'sync-invoice',
        payload: { invoice_id: invoiceId, errorType },
        error: errorMessage,
        user_id: invoice.user_id,
        severity: 'error'
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errorType 
      };
    }
    
  } catch (error) {
    console.error(`Error processing invoice ${invoiceId}:`, error);
    
    // Get the invoice to get the user_id for error logging
    const { data: invoice } = await supabase
      .from('invoices')
      .select('user_id')
      .eq('id', invoiceId)
      .single();
    
    // Determine error type for better UI feedback
    let errorType = 'unknown';
    let errorMessage = error.message || String(error);
    
    if (error.errorType) {
      errorType = error.errorType;
    } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('authoriz')) {
      errorType = 'token-expired';
      errorMessage = 'QuickBooks authorization expired. Please reconnect your QBO account.';
    } else if (errorMessage.includes('customer') || errorMessage.includes('contact')) {
      errorType = 'customer-error';
      errorMessage = `Customer error: ${errorMessage}`;
    } else if (errorMessage.includes('connect') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorType = 'connectivity';
      errorMessage = 'QuickBooks connectivity issue. Please try again later.';
    }
    
    // Update sync record with error using the new upsert function
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_provider: 'qbo',
      p_status: 'error',
      p_error: { message: errorMessage, type: errorType },
      p_error_message: errorMessage,
      p_user_id: invoice?.user_id
    });
    
    await logQboAction(supabase, {
      function_name: 'sync-invoice',
      payload: { invoice_id: invoiceId, errorType },
      error: errorMessage,
      user_id: invoice?.user_id,
      severity: 'error'
    });
    
    return { 
      success: false, 
      error: errorMessage,
      errorType 
    };
  }
}
