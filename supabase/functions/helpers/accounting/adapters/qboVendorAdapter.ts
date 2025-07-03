
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { ensureQboTokens, retryWithBackoff, logQboAction } from "../../qbo.ts";

export async function createVendor(
  supabase: ReturnType<typeof createClient>,
  vendor: any,
  environmentVars: {
    INTUIT_CLIENT_ID: string;
    INTUIT_CLIENT_SECRET: string;
    INTUIT_ENVIRONMENT: string;
  },
  qboConnection: any
): Promise<{ qboVendorId: string; providerMeta: any }> {
  console.log('Creating vendor in QBO:', vendor.name);

  // Get fresh tokens
  const tokens = await ensureQboTokens(
    supabase,
    qboConnection.user_id,
    environmentVars
  );

  const qboBaseUrl = environmentVars.INTUIT_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox.quickbooks.api.intuit.com';

  // Check if vendor already exists in QBO
  const existingVendorId = await findExistingVendor(
    supabase,
    qboConnection.user_id,
    vendor.id,
    vendor.name,
    tokens,
    qboBaseUrl
  );

  if (existingVendorId) {
    console.log(`Vendor ${vendor.name} already exists in QBO with ID ${existingVendorId}`);
    return {
      qboVendorId: existingVendorId,
      providerMeta: { operation: 'found_existing', vendor_name: vendor.name }
    };
  }

  // Transform vendor data to QBO format
  const qboVendorData = transformVendorToQbo(vendor);

  // Logger for retry attempts
  const retryLogger = async (attempt: number, error: Error) => {
    await logQboAction(supabase, {
      function_name: 'createVendor-retry',
      payload: { 
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        attempt,
        status: error.status || 'unknown'
      },
      error: `Retry attempt ${attempt}: ${error.message}`,
      user_id: qboConnection.user_id,
      severity: 'info'
    });
  };

  // Create vendor in QBO with retry logic
  const createVendorOperation = async () => {
    const qboCreateUrl = `${qboBaseUrl}/v3/company/${tokens.realm_id}/vendor?minorversion=65`;
    
    const response = await fetch(qboCreateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(qboVendorData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw {
        status: response.status,
        message: `Failed to create vendor in QBO: ${errorText}`,
        originalResponse: errorText
      };
    }

    return await response.json();
  };

  try {
    const qboVendorResponse = await retryWithBackoff(createVendorOperation, 3, 100, retryLogger);
    const qboVendorId = qboVendorResponse.Vendor.Id;
    
    console.log(`Vendor ${vendor.name} created in QBO with ID ${qboVendorId}`);

    // Cache the vendor
    await cacheVendor(supabase, qboConnection.user_id, vendor.id, qboVendorId, qboVendorResponse.Vendor);

    return {
      qboVendorId,
      providerMeta: {
        operation: 'created',
        vendor_name: vendor.name,
        qbo_response: qboVendorResponse.Vendor
      }
    };
  } catch (error) {
    console.error('Error creating vendor in QBO:', error);
    
    // Classify error for better UI messaging
    if (error.errorType === 'token-expired') {
      throw new Error('QBO authorization expired. Please reconnect your QBO account.');
    } else if (error.errorType === 'max-retries-exceeded') {
      throw new Error('QuickBooks connectivity issue: Unable to reach QuickBooks servers after multiple attempts. Please try again later.');
    } else {
      throw new Error(`QuickBooks connectivity issue: Unable to create vendor in QuickBooks. ${error.message || 'Please try again later.'}`);
    }
  }
}

async function findExistingVendor(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  vendorId: string,
  vendorName: string,
  tokens: any,
  qboBaseUrl: string
): Promise<string | null> {
  // Check cache first
  const { data: cachedVendor } = await supabase
    .from('qbo_contacts_cache')
    .select('qbo_id')
    .eq('user_id', userId)
    .eq('contact_type', 'vendor')
    .eq('external_id', vendorId)
    .single();

  if (cachedVendor?.qbo_id) {
    console.log(`Vendor ${vendorId} found in cache with QBO ID ${cachedVendor.qbo_id}`);
    return cachedVendor.qbo_id;
  }

  // Search in QBO by name
  try {
    const searchUrl = `${qboBaseUrl}/v3/company/${tokens.realm_id}/query?query=select * from Vendor where DisplayName = '${vendorName.replace(/'/g, "''")}'&minorversion=65`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const searchData = await response.json();
      if (searchData.QueryResponse?.Vendor?.length > 0) {
        const existingQboVendorId = searchData.QueryResponse.Vendor[0].Id;
        
        // Cache the found vendor
        await cacheVendor(supabase, userId, vendorId, existingQboVendorId, searchData.QueryResponse.Vendor[0]);
        
        return existingQboVendorId;
      }
    }
  } catch (error) {
    console.warn('Error searching for existing vendor:', error);
  }

  return null;
}

async function cacheVendor(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  vendorId: string,
  qboVendorId: string,
  qboVendorData: any
) {
  try {
    await supabase
      .from('qbo_contacts_cache')
      .upsert({
        user_id: userId,
        contact_type: 'vendor',
        external_id: vendorId,
        qbo_id: qboVendorId,
        data: qboVendorData
      }, {
        onConflict: 'user_id,contact_type,external_id'
      });
  } catch (error) {
    console.error('Error caching vendor:', error);
  }
}

function transformVendorToQbo(vendor: any) {
  const qboVendor: any = {
    DisplayName: vendor.name,
    CompanyName: vendor.name,
    Active: true,
    Vendor1099: false  // Default to false, can be updated later if needed
  };

  // Add contact information if available
  if (vendor.email) {
    qboVendor.PrimaryEmailAddr = {
      Address: vendor.email
    };
  }

  if (vendor.phone) {
    qboVendor.PrimaryPhone = {
      FreeFormNumber: vendor.phone
    };
  }

  // Add address if available
  if (vendor.address) {
    qboVendor.BillAddr = {
      Line1: vendor.address
    };
  }

  // Add construction-specific fields as custom fields if available
  const customFields = [];
  
  if (vendor.license_number) {
    customFields.push({
      DefinitionId: "1",
      Name: "LicenseNumber",
      Type: "StringType",
      StringValue: vendor.license_number
    });
  }

  if (vendor.tax_id) {
    customFields.push({
      DefinitionId: "2", 
      Name: "TaxID",
      Type: "StringType",
      StringValue: vendor.tax_id
    });
  }

  if (vendor.insurance_expiry) {
    customFields.push({
      DefinitionId: "3",
      Name: "InsuranceExpiry", 
      Type: "StringType",
      StringValue: vendor.insurance_expiry
    });
  }

  if (customFields.length > 0) {
    qboVendor.CustomField = customFields;
  }

  return qboVendor;
}
