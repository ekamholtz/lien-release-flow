
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Company } from '@/lib/types/company';

export function useCompanies() {
  const queryClient = useQueryClient();

  // Get all companies the user belongs to
  const { 
    data: companies = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      // Using a join to get companies through company_members
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          company_id,
          companies:company_id(
            id,
            name,
            external_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Transform the data to get just the companies
      return data.map(item => item.companies) as Company[];
    }
  });

  // Create a new company
  const createCompany = useMutation({
    mutationFn: async (name: string) => {
      // First create the company
      const { data: companyData, error: companyError } = await supabase.rpc(
        'create_company_with_admin',
        { 
          p_name: name,
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          p_email: (await supabase.auth.getUser()).data.user?.email || ''
        }
      );

      if (companyError) throw companyError;
      return companyData as Company;
    },
    onSuccess: (newCompany) => {
      toast.success('Company created successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      return newCompany;
    },
    onError: (error) => {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    }
  });
  
  // Update company details
  const updateCompany = useMutation({
    mutationFn: async (company: Partial<Company> & { id: string }) => {
      const { data: companyData, error: companyError } = await supabase.rpc(
        'update_company',
        {
          p_id: company.id,
          p_name: company.name,
          p_external_id: company.external_id
        }
      );
        
      if (companyError) throw companyError;
      return companyData as Company;
    },
    onSuccess: (updatedCompany) => {
      toast.success('Company updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      return updatedCompany;
    },
    onError: (error) => {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    }
  });

  return {
    companies,
    isLoading,
    error,
    createCompany,
    updateCompany,
    refetch
  };
}
