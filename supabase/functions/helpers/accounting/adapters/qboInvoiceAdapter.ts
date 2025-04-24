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
  // Handle date formatting safely to prevent Invalid time value errors
  const formattedInvoice = {
    ...invoice,
  };

  // Safely format due_date if it exists - ensure it's a valid date string in YYYY-MM-DD format
  if (invoice.due_date) {
    try {
      // First check if it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(invoice.due_date)) {
        formattedInvoice.due_date = invoice.due_date;
      } else {
        // Otherwise try to parse and format it
        const dateObj = new Date(invoice.due_date);
        if (!isNaN(dateObj.getTime())) {
          formattedInvoice.due_date = dateObj.toISOString().split('T')[0];
        } else {
          console.warn('Invalid due_date provided:', invoice.due_date);
          formattedInvoice.due_date = null;
        }
      }
    } catch (error) {
      console.warn('Error formatting due_date:', error);
      formattedInvoice.due_date = null;
    }
  }

  // Don't try to format created_at for QBO, as it's not needed for the invoice creation
  // Just remove it to avoid potential issues
  delete formattedInvoice.created_at;
  
  // Get user's QBO tokens
  const tokens = await ensureQboTokens(
    supabase,
    formattedInvoice.user_id,
    environmentVars
  );

  // Get or create QBO customer
  const qboCustomerId = await getOrCreateCustomer(
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

  // Map and create invoice in QBO
  const qboInvoice = mapInvoiceToQbo(formattedInvoice, qboCustomerId);
  const qboResponses = await batchCreateInQbo(
    [qboInvoice],
    'Invoice',
    tokens,
    { INTUIT_ENVIRONMENT: environmentVars.INTUIT_ENVIRONMENT }
  );
  
  if (!qboResponses.length || !qboResponses[0].Invoice?.Id) {
    throw new Error('QBO did not return an invoice ID');
  }

  return {
    qboInvoiceId: qboResponses[0].Invoice.Id,
    providerRef: qboResponses[0].Invoice.Id,
    providerMeta: qboResponses[0]
  };
}
