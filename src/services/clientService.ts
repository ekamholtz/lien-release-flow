
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
};

export async function getClients(companyId?: string) {
  try {
    if (!companyId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
      
    if (error) throw error;
    
    return data as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    toast.error('Failed to load clients');
    return [];
  }
}

export async function getClientById(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
      
    if (error) throw error;
    
    return data as Client;
  } catch (error) {
    console.error('Error fetching client:', error);
    toast.error('Failed to load client details');
    return null;
  }
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
      
    if (error) throw error;
    
    toast.success('Client created successfully');
    return data as Client;
  } catch (error) {
    console.error('Error creating client:', error);
    toast.error('Failed to create client');
    return null;
  }
}

export async function updateClient(id: string, client: Partial<Client>) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    toast.success('Client updated successfully');
    return data as Client;
  } catch (error) {
    console.error('Error updating client:', error);
    toast.error('Failed to update client');
    return null;
  }
}

export async function deleteClient(id: string) {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast.success('Client deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    toast.error('Failed to delete client');
    return false;
  }
}
