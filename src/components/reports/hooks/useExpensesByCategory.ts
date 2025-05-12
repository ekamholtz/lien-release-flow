
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateExpensesByCategory } from '../utils/dataTransformUtils';
import { getStartDateFromTimeRange } from '../utils/timeRangeUtils';
import { getMockExpensesData } from '../utils/mockDataUtils';

export function useExpensesByCategory(timeRange: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const startDate = getStartDateFromTimeRange(timeRange);
        
        const { data: expenseData, error: expenseError } = await supabase
          .from('bills')
          .select('amount, vendor_name')
          .gte('created_at', startDate.toISOString());
          
        if (expenseError) {
          console.error('Error fetching expenses:', expenseError);
          setData(getMockExpensesData());
          return;
        }
        
        if (expenseData && expenseData.length > 0) {
          const expensesByCategory = calculateExpensesByCategory(expenseData);
          setData(expensesByCategory);
        } else {
          setData(getMockExpensesData());
        }
      } catch (error) {
        console.error('Error fetching expense data:', error);
        setData(getMockExpensesData());
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  return { data, loading };
}
