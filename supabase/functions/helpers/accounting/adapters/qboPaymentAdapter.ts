
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { ensureQboTokens, retryWithBackoff, logQboAction } from "../../qbo.ts";

export async function createPayment(
  supabase: ReturnType<typeof createClient>,
  payment: any,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  },
  qboConnection: any
): Promise<{ qboPaymentId: string; providerMeta: any }> {
  console.log('Creating payment in QBO:', payment.id);

  // Get fresh tokens
  const tokens = await ensureQboTokens(
    supabase,
    qboConnection.user_id,
    environmentVars
  );

  const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox.quickbooks.api.intuit.com';

  // Check if payment already exists in QBO
  const existingPaymentId = await findExistingPayment(
    supabase,
    qboConnection.user_id,
    payment.id,
    tokens,
    qboBaseUrl
  );

  if (existingPaymentId) {
    console.log(`Payment ${payment.id} already exists in QBO with ID ${existingPaymentId}`);
    return {
      qboPaymentId: existingPaymentId,
      providerMeta: { operation: 'found_existing', payment_id: payment.id }
    };
  }

  // Get related entity (invoice or bill) for payment
  const relatedEntity = await getRelatedEntity(supabase, payment);
  
  // Transform payment data to QBO format
  const qboPaymentData = transformPaymentToQbo(payment, relatedEntity);

  // Logger for retry attempts
  const retryLogger = async (attempt: number, error: Error) => {
    await logQboAction(supabase, {
      function_name: 'createPayment-retry',
      payload: { 
        payment_id: payment.id,
        attempt,
        status: error.status || 'unknown'
      },
      error: `Retry attempt ${attempt}: ${error.message}`,
      user_id: qboConnection.user_id,
      severity: 'info'
    });
  };

  // Create payment in QBO with retry logic
  const createPaymentOperation = async () => {
    const qboCreateUrl = `${qboBaseUrl}/v3/company/${tokens.realm_id}/payment?minorversion=65`;
    
    const response = await fetch(qboCreateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(qboPaymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw {
        status: response.status,
        message: `Failed to create payment in QBO: ${errorText}`,
        originalResponse: errorText
      };
    }

    return await response.json();
  };

  try {
    const qboPaymentResponse = await retryWithBackoff(createPaymentOperation, 3, 100, retryLogger);
    const qboPaymentId = qboPaymentResponse.Payment.Id;
    
    console.log(`Payment ${payment.id} created in QBO with ID ${qboPaymentId}`);

    return {
      qboPaymentId,
      providerMeta: {
        operation: 'created',
        payment_id: payment.id,
        qbo_response: qboPaymentResponse.Payment
      }
    };
  } catch (error) {
    console.error('Error creating payment in QBO:', error);
    
    // Classify error for better UI messaging
    if (error.errorType === 'token-expired') {
      throw new Error('QBO authorization expired. Please reconnect your QBO account.');
    } else if (error.errorType === 'max-retries-exceeded') {
      throw new Error('QuickBooks connectivity issue: Unable to reach QuickBooks servers after multiple attempts. Please try again later.');
    } else {
      throw new Error(`QuickBooks connectivity issue: Unable to create payment in QuickBooks. ${error.message || 'Please try again later.'}`);
    }
  }
}

async function findExistingPayment(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  paymentId: string,
  tokens: any,
  qboBaseUrl: string
): Promise<string | null> {
  // Check existing sync records first
  const { data: syncRecord } = await supabase
    .from('accounting_sync')
    .select('provider_ref')
    .eq('entity_type', 'payment')
    .eq('entity_id', paymentId)
    .eq('provider', 'qbo')
    .eq('status', 'success')
    .single();

  if (syncRecord?.provider_ref) {
    return syncRecord.provider_ref;
  }

  return null;
}

async function getRelatedEntity(
  supabase: ReturnType<typeof createClient>,
  payment: any
) {
  if (payment.entity_type === 'invoice') {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('id', payment.entity_id)
      .single();
    return invoice;
  } else if (payment.entity_type === 'bill') {
    const { data: bill } = await supabase
      .from('bills')
      .select('*, vendors(name)')
      .eq('id', payment.entity_id)
      .single();
    return bill;
  }
  return null;
}

function transformPaymentToQbo(payment: any, relatedEntity: any) {
  const isCustomerPayment = payment.entity_type === 'invoice';
  
  if (isCustomerPayment) {
    // Customer payment for invoice
    return {
      CustomerRef: {
        value: relatedEntity?.client_id || "1",
        name: relatedEntity?.client_name || relatedEntity?.clients?.name || "Customer"
      },
      TotalAmt: payment.amount,
      TxnDate: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      PaymentMethodRef: {
        value: getQboPaymentMethodId(payment.payment_method)
      },
      PrivateNote: `Payment for Invoice ${relatedEntity?.invoice_number || payment.entity_id}`,
      Line: [{
        Amount: payment.amount,
        LinkedTxn: [{
          TxnType: "Invoice",
          TxnId: relatedEntity?.qbo_invoice_id || "1"
        }]
      }]
    };
  } else {
    // Bill payment for vendor
    return {
      VendorRef: {
        value: relatedEntity?.vendor_id || "1",
        name: relatedEntity?.vendor_name || relatedEntity?.vendors?.name || "Vendor"
      },
      TotalAmt: payment.amount,
      TxnDate: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      PaymentType: "Check", // Default for bill payments
      CheckPayment: {
        BankAccountRef: {
          value: "35", // Default checking account
          name: "Checking"
        },
        PrintStatus: "NotSet"
      },
      Line: [{
        Amount: payment.amount,
        LinkedTxn: [{
          TxnType: "Bill",
          TxnId: relatedEntity?.qbo_bill_id || "1"
        }]
      }]
    };
  }
}

function getQboPaymentMethodId(paymentMethod: string): string {
  // Map payment methods to QBO payment method IDs
  switch (paymentMethod) {
    case 'credit_card':
      return '2';
    case 'ach':
      return '3';
    case 'check':
      return '1';
    case 'cash':
      return '4';
    case 'wire_transfer':
      return '5';
    default:
      return '1'; // Default to check
  }
}
