
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Company } from '@/lib/types/company';

interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  error: Error | null;
  switchCompany: (companyId: string) => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshCompanies = async () => {
    if (!user) {
      setCompanies([]);
      setCurrentCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get all companies the user belongs to
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
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Transform to extract companies from the joined result
      const userCompanies = data.map(item => ({
        id: item.companies.id,
        name: item.companies.name,
        external_id: item.companies.external_id,
        created_at: item.companies.created_at,
        updated_at: item.companies.updated_at
      })) as Company[];

      setCompanies(userCompanies);

      // If we have companies but no current company set, use the first one
      if (userCompanies.length > 0 && !currentCompany) {
        setCurrentCompany(userCompanies[0]);
      } else if (userCompanies.length === 0) {
        // No companies for this user
        setCurrentCompany(null);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(err instanceof Error ? err : new Error('Failed to load companies'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const selectedCompany = companies.find(c => c.id === companyId);
      if (!selectedCompany) {
        throw new Error('Company not found');
      }

      // Call the edge function to refresh the JWT with the company context
      const { data: switchData, error: switchError } = await supabase.functions.invoke(
        'switch-company',
        { body: { companyId } }
      );

      if (switchError) throw switchError;

      // Update the current company state
      setCurrentCompany(selectedCompany);
      
      // Show success message
      toast.success(`Switched to ${selectedCompany.name}`);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      return;
    } catch (err) {
      console.error('Error switching company:', err);
      toast.error('Failed to switch company');
      throw err;
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, [user]);

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        isLoading,
        error,
        switchCompany,
        refreshCompanies
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
