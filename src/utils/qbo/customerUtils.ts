import { supabase } from "@/integrations/supabase/client";

export interface QboCustomer {
  id: string;
  name: string;
  email?: string;
  qbo_id?: string;
}

export async function getOrCreateQboCustomer(
  clientId: string, 
  clientName: string, 
  clientEmail: string,
  companyId: string,
  accessToken: string
): Promise<string> {
  try {
    console.log('Getting or creating QBO customer for:', { clientId, clientName, clientEmail });
    
    // First check if we already have a QBO customer ID for this client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('qbo_customer_id')
      .eq('id', clientId)
      .eq('company_id', companyId)
      .single();
    
    if (clientError && clientError.code !== 'PGRST116') {
      console.error('Error fetching client:', clientError);
      throw clientError;
    }
    
    // If we already have a QBO customer ID, return it
    if (client?.qbo_customer_id) {
      console.log('Found existing QBO customer ID:', client.qbo_customer_id);
      return client.qbo_customer_id;
    }
    
    // Otherwise, create a new customer in QBO
    console.log('Creating new QBO customer');
    
    const response = await fetch(
      'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-project-customer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          client_id: clientId,
          client_name: clientName,
          client_email: clientEmail,
          company_id: companyId
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create QBO customer:', errorText);
      throw new Error(`Failed to create QBO customer: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.qbo_customer_id) {
      // Update the client record with the new QBO customer ID
      const { error: updateError } = await supabase
        .from('clients')
        .update({ qbo_customer_id: result.qbo_customer_id })
        .eq('id', clientId)
        .eq('company_id', companyId);
      
      if (updateError) {
        console.error('Error updating client with QBO customer ID:', updateError);
        // Don't throw here - the customer was created successfully
      }
      
      console.log('Created QBO customer with ID:', result.qbo_customer_id);
      return result.qbo_customer_id;
    } else {
      throw new Error('QBO customer creation did not return a customer ID');
    }
    
  } catch (error) {
    console.error('Error in getOrCreateQboCustomer:', error);
    throw error;
  }
}

export async function syncCustomerToQbo(
  customerId: string,
  companyId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      'https://oknofqytitpxmlprvekn.functions.supabase.co/sync-project-customer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          customer_id: customerId,
          company_id: companyId
        })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error syncing customer to QBO:', error);
    return false;
  }
}
