
import { logQboAction, ensureQboTokens, retryWithBackoff } from "../qbo.ts";

export async function processInvoiceSync(supabase: any, invoiceId: string, environmentVars: any) {
  console.log('Starting invoice sync for:', invoiceId);

  try {
    // Get invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(*),
        projects(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Not found'}`);
    }

    // Get user_id from company_members
    let userId = invoice.user_id;
    if (!userId && invoice.company_id) {
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('user_id')
        .eq('company_id', invoice.company_id)
        .eq('status', 'active')
        .limit(1)
        .single();
      
      userId = companyMember?.user_id;
    }

    if (!userId) {
      throw new Error('No user ID found for invoice sync');
    }

    // Get QBO connection for the user
    const { data: qboConnection, error: qboConnectionError } = await supabase
      .from('qbo_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (qboConnectionError || !qboConnection) {
      throw new Error(`No QBO connection found: ${qboConnectionError?.message || 'Not found'}`);
    }

    // Get fresh tokens
    const tokens = await ensureQboTokens(supabase, userId, environmentVars);

    const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox.quickbooks.api.intuit.com';

    // Create QBO invoice data
    const invoiceData = {
      Line: [{
        Amount: invoice.amount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: {
            value: "1", // Default service item
            name: "Services"
          }
        },
        Description: `Invoice ${invoice.invoice_number}`
      }],
      CustomerRef: {
        value: "1", // Default customer - should be mapped properly
        name: invoice.client_name
      },
      TotalAmt: invoice.amount,
      DueDate: invoice.due_date,
      DocNumber: invoice.invoice_number
    };

    // Create invoice in QBO with retry logic
    const createInvoiceOperation = async () => {
      const response = await fetch(
        `${qboBaseUrl}/v3/company/${tokens.realm_id}/invoice?minorversion=65`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ Invoice: invoiceData })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create QBO invoice: ${errorText}`);
      }

      const result = await response.json();
      return result.QueryResponse?.Invoice?.[0] || result.Invoice;
    };

    const retryLogger = async (attempt: number, error: Error) => {
      await logQboAction(supabase, {
        function_name: 'processInvoiceSync-retry',
        payload: { invoice_id: invoiceId, attempt },
        error: `Retry attempt ${attempt}: ${error.message}`,
        user_id: userId,
        severity: 'info'
      });
    };

    const qboInvoice = await retryWithBackoff(createInvoiceOperation, 3, 100, retryLogger);

    if (!qboInvoice?.Id) {
      throw new Error('QBO invoice creation returned no ID');
    }

    // Update invoice with QBO reference
    await supabase
      .from('invoices')
      .update({ qbo_invoice_id: qboInvoice.Id })
      .eq('id', invoiceId);

    // Update sync status with company_id
    await supabase.rpc('update_sync_status', {
      p_entity_type: 'invoice',
      p_entity_id: invoiceId,
      p_provider: 'qbo',
      p_status: 'success',
      p_provider_ref: qboInvoice.Id,
      p_provider_meta: {
        qbo_invoice: qboInvoice,
        operation: 'create'
      },
      p_user_id: userId
    });

    // Also update the company_id in the sync record directly
    await supabase
      .from('accounting_sync')
      .update({ company_id: invoice.company_id })
      .eq('entity_type', 'invoice')
      .eq('entity_id', invoiceId)
      .eq('provider', 'qbo');

    await logQboAction(supabase, {
      function_name: 'processInvoiceSync',
      payload: { 
        invoice_id: invoiceId,
        qbo_invoice_id: qboInvoice.Id,
        amount: invoice.amount
      },
      user_id: userId,
      severity: 'info'
    });

    return {
      success: true,
      qbo_invoice_id: qboInvoice.Id,
      message: 'Invoice synced successfully'
    };

  } catch (error) {
    console.error('Error in processInvoiceSync:', error);
    
    // Try to get user_id for error logging
    let userId = null;
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('user_id, company_id')
        .eq('id', invoiceId)
        .single();
      
      userId = invoice?.user_id;
      
      if (!userId && invoice?.company_id) {
        const { data: companyMember } = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', invoice.company_id)
          .eq('status', 'active')
          .limit(1)
          .single();
        
        userId = companyMember?.user_id;
      }
    } catch (e) {
      console.error('Error getting user_id for error logging:', e);
    }

    await logQboAction(supabase, {
      function_name: 'processInvoiceSync',
      payload: { invoice_id: invoiceId },
      error: error.message || String(error),
      user_id: userId,
      severity: 'error'
    });

    throw error; // Re-throw for upstream handling
  }
}
