
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

      // Using an RPC function to get user's companies
      const { data, error } = await supabase.rpc('get_user_companies');

      if (error) throw error;

      // Set the companies from the RPC results
      setCompanies(data || []);

      // If we have companies but no current company set, use the first one
      if (data && data.length > 0 && !currentCompany) {
        setCurrentCompany(data[0]);
      } else if (!data || data.length === 0) {
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
