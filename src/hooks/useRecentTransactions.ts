
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { fetchRecentTransactions } from './utils/fetchRecentTransactions';
import type { UseRecentTransactionsProps } from './types/useRecentTransactionsTypes';

export function useRecentTransactions({ projectId, dateRange, managerId }: UseRecentTransactionsProps) {
  const { currentCompany } = useCompany();
  
  return useQuery({
    queryKey: ['recent-transactions', projectId, currentCompany?.id, dateRange, managerId],
    queryFn: async () => {
      // If no current company, return empty array
      if (!currentCompany?.id) {
        console.log("No current company selected");
        return [];
      }
      
      return fetchRecentTransactions(currentCompany.id, { projectId, dateRange, managerId });
    },
    enabled: !!currentCompany?.id
  });
}
