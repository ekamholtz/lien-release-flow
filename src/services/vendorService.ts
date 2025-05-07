
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Vendor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateVendorInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_id: string;
};

export async function getVendors(companyId?: string) {
  try {
    if (!companyId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
      
    if (error) throw error;
    
    return data as Vendor[];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    toast.error('Failed to load vendors');
    return [];
  }
}

export async function getVendorById(vendorId: string) {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();
      
    if (error) throw error;
    
    return data as Vendor;
  } catch (error) {
    console.error('Error fetching vendor:', error);
    toast.error('Failed to load vendor details');
    return null;
  }
}

export async function createVendor(vendor: CreateVendorInput) {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();
      
    if (error) throw error;
    
    toast.success('Vendor created successfully');
    return data as Vendor;
  } catch (error) {
    console.error('Error creating vendor:', error);
    toast.error('Failed to create vendor');
    return null;
  }
}

export async function updateVendor(id: string, vendor: Partial<Vendor>) {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .update(vendor)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    toast.success('Vendor updated successfully');
    return data as Vendor;
  } catch (error) {
    console.error('Error updating vendor:', error);
    toast.error('Failed to update vendor');
    return null;
  }
}

export async function deleteVendor(id: string) {
  try {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast.success('Vendor deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting vendor:', error);
    toast.error('Failed to delete vendor');
    return false;
  }
}
