
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
  // Format the due_date to ensure it's in YYYY-MM-DD format
  const formattedInvoice = {
    ...invoice,
    due_date: invoice.due_date ? invoice.due_date.split('T')[0] : invoice.due_date
  };
  
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
