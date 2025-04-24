
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { 
  ensureQboTokens, 
  getOrCreateCustomer, 
  mapInvoiceToQbo,
  batchCreateInQbo, 
  logQboAction 
} from "../qbo.ts";

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
  // Get user's QBO tokens
  const tokens = await ensureQboTokens(
    supabase,
    invoice.user_id,
    environmentVars
  );

  // Get or create QBO customer
  const qboCustomerId = await getOrCreateCustomer(
    supabase,
    invoice.user_id,
    {
      external_id: invoice.client_email,
      display_name: invoice.client_name,
      email: invoice.client_email
    },
    tokens,
    { INTUIT_ENVIRONMENT: environmentVars.INTUIT_ENVIRONMENT }
  );

  // Map and create invoice in QBO
  const qboInvoice = mapInvoiceToQbo(invoice, qboCustomerId);
  const qboResponses = await batchCreateInQbo(
    [qboInvoice],
    'Invoice',
    tokens,
    { INTUIT_ENVIRONMENT: environmentVars.INTUIT_ENVIRONMENT }
  );
  
  if (!qboResponses.length || !qboResponses[0].Invoice?.Id) {
    throw new Error('QBO did not return an invoice ID');
  }

  const qboInvoiceId = qboResponses[0].Invoice.Id;

  // Log the successful action
  await logQboAction(supabase, {
    user_id: invoice.user_id,
    function_name: 'sync-invoice',
    payload: { invoice_id: invoice.id, qbo_invoice_id: qboInvoiceId },
    severity: 'info'
  });

  return {
    qboInvoiceId,
    providerRef: qboInvoiceId,
    providerMeta: qboResponses[0]
  };
}
