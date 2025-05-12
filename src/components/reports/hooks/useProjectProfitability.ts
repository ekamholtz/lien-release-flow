
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMockProjectData } from '../utils/mockDataUtils';

export function useProjectProfitability(startDate: Date) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, value');
          
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          setData(getMockProjectData());
          return;
        }
        
        if (projectsData.length === 0) {
          setData(getMockProjectData());
          return;
        }
        
        const result = [];
        
        for (const project of projectsData) {
          const projectId = project.id;
          
          const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('amount, status')
            .eq('project_id', projectId)
            .eq('status', 'paid');
            
          if (invoicesError) {
            console.error(`Error fetching invoices for project ${projectId}:`, invoicesError);
          }
          
          const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select('amount, status')
            .eq('project_id', projectId)
            .eq('status', 'paid');
            
          if (billsError) {
            console.error(`Error fetching bills for project ${projectId}:`, billsError);
          }
          
          const revenue = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
          const expenses = (bills || []).reduce((sum, bill) => sum + Number(bill.amount), 0);
          const profit = revenue - expenses;
          
          result.push({
            name: project.name,
            profit: profit
          });
        }
        
        setData(result.sort((a, b) => b.profit - a.profit));
      } catch (error) {
        console.error('Error calculating project profitability:', error);
        setData(getMockProjectData());
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [startDate]);

  return { data, loading };
}
