
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { 
  ensureQboTokens, 
  getOrCreateCustomer,
  mapInvoiceToQbo,
  batchCreateInQbo
} from "../../qbo.ts";

export interface QboInvoiceResult {
  qboInvoiceId: string;
  providerRef: string;
  providerMeta: any;
}

export async function createInvoice(
  supabase: ReturnType<typeof createClient>,
  invoice: any,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  }
): Promise<QboInvoiceResult> {
  // Create a clean copy of the invoice without problematic date fields
  const formattedInvoice = { ...invoice };
  
  // Remove created_at to avoid potential date issues
  delete formattedInvoice.created_at;
  
  // Handle due_date formatting safely
  if (formattedInvoice.due_date) {
    try {
      // First check if it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(formattedInvoice.due_date)) {
        // Format is already correct, no changes needed
      } else {
        // Try to parse and format the date
        const dateObj = new Date(formattedInvoice.due_date);
        if (!isNaN(dateObj.getTime())) {
          // Format as YYYY-MM-DD
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          formattedInvoice.due_date = `${year}-${month}-${day}`;
        } else {
          console.warn('Invalid due_date provided:', formattedInvoice.due_date);
          formattedInvoice.due_date = null;
        }
      }
    } catch (error) {
      console.warn('Error formatting due_date:', error);
      formattedInvoice.due_date = null;
    }
  }

  try {
    // Get user's QBO tokens with network error handling
    let tokens;
    try {
      tokens = await ensureQboTokens(
        supabase,
        formattedInvoice.user_id,
        environmentVars
      );
    } catch (error) {
      if (error.message && error.message.includes('sending request for url')) {
        throw new Error(`QuickBooks connectivity issue: Unable to reach QuickBooks servers. Please check your internet connection and try again later.`);
      } else if (error.message && error.message.includes('No QuickBooks connection found')) {
        throw new Error(`QuickBooks not connected: Please connect your QuickBooks account in the Integrations settings.`);
      } else {
        throw error;
      }
    }

    // Get or create QBO customer
    let qboCustomerId;
    try {
      qboCustomerId = await getOrCreateCustomer(
        supabase,
        formattedInvoice.user_id,
        {
          external_id: formattedInvoice.client_email,
          display_name: formattedInvoice.client_name,
          email: formattedInvoice.client_email
        },
        tokens,
        { INTUIT_ENVIRONMENT: environmentVars.INTUIT_ENVIRONMENT }
      );
    } catch (error) {
      if (error.message && error.message.includes('sending request for url')) {
        throw new Error(`QuickBooks connectivity issue: Unable to create or find the customer in QuickBooks. Please try again later.`);
      } else {
        throw error;
      }
    }

    // Map and create invoice in QBO
    const qboInvoice = mapInvoiceToQbo(formattedInvoice, qboCustomerId);
    let qboResponses;
    
    try {
      qboResponses = await batchCreateInQbo(
        [qboInvoice],
        'Invoice',
        tokens,
        { INTUIT_ENVIRONMENT: environmentVars.INTUIT_ENVIRONMENT }
      );
    } catch (error) {
      if (error.message && error.message.includes('sending request for url')) {
        throw new Error(`QuickBooks connectivity issue: Unable to create the invoice in QuickBooks. Please try again later.`);
      } else {
        throw error;
      }
    }
    
    if (!qboResponses.length || !qboResponses[0].Invoice?.Id) {
      throw new Error('QBO did not return an invoice ID');
    }

    return {
      qboInvoiceId: qboResponses[0].Invoice.Id,
      providerRef: qboResponses[0].Invoice.Id,
      providerMeta: qboResponses[0]
    };
  } catch (error) {
    console.error('Error creating invoice in QBO:', error);
    throw error;
  }
}
