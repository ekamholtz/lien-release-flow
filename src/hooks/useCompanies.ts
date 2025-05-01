
import { useState, useEffect } from 'react';
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
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Company[];
    }
  });

  // Create a new company
  const createCompany = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('companies')
        .insert({ name })
        .select()
        .single();
        
      if (error) throw error;
      
      // After creating company, add current user as admin
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: data.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'company_admin',
          status: 'active',
          invited_email: (await supabase.auth.getUser()).data.user?.email || '',
          accepted_at: new Date().toISOString()
        });

      if (memberError) throw memberError;
      return data as Company;
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
      const { data, error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', company.id)
        .select()
        .single();
        
      if (error) throw error;
      return data as Company;
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
