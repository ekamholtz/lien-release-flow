
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { ensureQboTokens, retryWithBackoff, logQboAction } from "../../qbo.ts";

export async function createBill(
  supabase: ReturnType<typeof createClient>,
  bill: any,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  },
  qboConnection: any
): Promise<{ qboBillId: string; providerMeta: any }> {
  console.log('Creating bill in QBO:', bill.bill_number);

  // Get fresh tokens
  const tokens = await ensureQboTokens(
    supabase,
    qboConnection.user_id,
    environmentVars
  );

  const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox.quickbooks.api.intuit.com';

  // Check if bill already exists in QBO
  const existingBillId = await findExistingBill(
    supabase,
    qboConnection.user_id,
    bill.id,
    bill.bill_number,
    tokens,
    qboBaseUrl
  );

  if (existingBillId) {
    console.log(`Bill ${bill.bill_number} already exists in QBO with ID ${existingBillId}`);
    return {
      qboBillId: existingBillId,
      providerMeta: { operation: 'found_existing', bill_number: bill.bill_number }
    };
  }

  // Get account mappings for line items
  const { data: accountMappings } = await supabase
    .from('qbo_account_mappings')
    .select('*')
    .eq('user_id', qboConnection.user_id);

  // Transform bill data to QBO format
  const qboBillData = transformBillToQbo(bill, accountMappings);

  // Logger for retry attempts
  const retryLogger = async (attempt: number, error: Error) => {
    await logQboAction(supabase, {
      function_name: 'createBill-retry',
      payload: { 
        bill_id: bill.id,
        bill_number: bill.bill_number,
        attempt,
        status: error.status || 'unknown'
      },
      error: `Retry attempt ${attempt}: ${error.message}`,
      user_id: qboConnection.user_id,
      severity: 'info'
    });
  };

  // Create bill in QBO with retry logic
  const createBillOperation = async () => {
    const qboCreateUrl = `${qboBaseUrl}/v3/company/${tokens.realm_id}/bill?minorversion=65`;
    
    const response = await fetch(qboCreateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(qboBillData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw {
        status: response.status,
        message: `Failed to create bill in QBO: ${errorText}`,
        originalResponse: errorText
      };
    }

    return await response.json();
  };

  try {
    const qboBillResponse = await retryWithBackoff(createBillOperation, 3, 100, retryLogger);
    const qboBillId = qboBillResponse.Bill.Id;
    
    console.log(`Bill ${bill.bill_number} created in QBO with ID ${qboBillId}`);

    return {
      qboBillId,
      providerMeta: {
        operation: 'created',
        bill_number: bill.bill_number,
        qbo_response: qboBillResponse.Bill
      }
    };
  } catch (error) {
    console.error('Error creating bill in QBO:', error);
    
    // Classify error for better UI messaging
    if (error.errorType === 'token-expired') {
      throw new Error('QBO authorization expired. Please reconnect your QBO account.');
    } else if (error.errorType === 'max-retries-exceeded') {
      throw new Error('QuickBooks connectivity issue: Unable to reach QuickBooks servers after multiple attempts. Please try again later.');
    } else {
      throw new Error(`QuickBooks connectivity issue: Unable to create bill in QuickBooks. ${error.message || 'Please try again later.'}`);
    }
  }
}

async function findExistingBill(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  billId: string,
  billNumber: string,
  tokens: any,
  qboBaseUrl: string
): Promise<string | null> {
  // Search in QBO by reference number (bill number)
  try {
    const searchUrl = `${qboBaseUrl}/v3/company/${tokens.realm_id}/query?query=select * from Bill where DocNumber = '${billNumber.replace(/'/g, "''")}'&minorversion=65`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const searchData = await response.json();
      if (searchData.QueryResponse?.Bill?.length > 0) {
        const existingQboBillId = searchData.QueryResponse.Bill[0].Id;
        return existingQboBillId;
      }
    }
  } catch (error) {
    console.warn('Error searching for existing bill:', error);
  }

  return null;
}

function transformBillToQbo(bill: any, accountMappings: any[]) {
  const qboBill: any = {
    VendorRef: {
      value: bill.vendors.qbo_vendor_id,
      name: bill.vendors.name
    },
    TxnDate: bill.created_at.split('T')[0], // Use created_at as bill date
    DueDate: bill.due_date,
    DocNumber: bill.bill_number,
    TotalAmt: bill.amount,
    PrivateNote: `Bill #${bill.bill_number}${bill.project_id ? ` - Project: ${bill.projects?.name || 'Unknown'}` : ''}`,
    APAccountRef: {
      value: "33", // Standard Accounts Payable account
      name: "Accounts Payable (A/P)"
    }
  };

  // Add line items if they exist
  if (bill.bill_line_items && bill.bill_line_items.length > 0) {
    qboBill.Line = bill.bill_line_items.map((item: any, index: number) => {
      // Find corresponding QBO account for expense category
      const accountMapping = accountMappings?.find(
        mapping => mapping.local_category_mapping?.category_id === item.category_id
      );

      const lineItem: any = {
        Id: (index + 1).toString(),
        Amount: item.amount,
        Description: item.description || 'Expense',
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: accountMapping?.qbo_account_id || "1", // Default expense account
            name: accountMapping?.qbo_account_name || "Expenses"
          },
          BillableStatus: item.billable ? "Billable" : "NotBillable"
        }
      };

      // Add project reference for job costing if available
      if (bill.projects?.qbo_customer_id && item.billable) {
        lineItem.AccountBasedExpenseLineDetail.CustomerRef = {
          value: bill.projects.qbo_customer_id,
          name: bill.projects.name
        };
      }

      return lineItem;
    });
  } else {
    // Create a single line item for the total amount if no line items exist
    qboBill.Line = [{
      Id: "1",
      Amount: bill.amount,
      Description: `Bill ${bill.bill_number}`,
      DetailType: "AccountBasedExpenseLineDetail",
      AccountBasedExpenseLineDetail: {
        AccountRef: {
          value: "1", // Default expense account
          name: "Expenses"
        },
        BillableStatus: "NotBillable"
      }
    }];
  }

  return qboBill;
}
