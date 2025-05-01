
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
        .from('companies')
        .select(`
          id,
          name,
          external_id,
          created_at,
          updated_at,
          company_members!inner(user_id, status)
        `)
        .eq('company_members.user_id', user.id)
        .eq('company_members.status', 'active');

      if (error) throw error;

      // Transform to remove the nested structure
      const userCompanies = data.map(item => ({
        id: item.id,
        name: item.name,
        external_id: item.external_id,
        created_at: item.created_at,
        updated_at: item.updated_at
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

      // In a real implementation, this would call the edge function to refresh the JWT
      // For now, we'll just update the state
      setCurrentCompany(selectedCompany);
      
      // Refresh data that depends on the current company
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
