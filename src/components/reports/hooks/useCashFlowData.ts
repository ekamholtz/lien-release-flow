
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { transformCashFlowData } from '../utils/dataTransformUtils';
import { getStartDateFromTimeRange } from '../utils/timeRangeUtils';
import { getMockCashFlowData } from '../utils/mockDataUtils';

export function useCashFlowData(timeRange: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const startDate = getStartDateFromTimeRange(timeRange);
        
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('amount, created_at, status')
          .gte('created_at', startDate.toISOString());
          
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('amount, created_at, status')
          .gte('created_at', startDate.toISOString());
          
        if (invoicesError) console.error('Error fetching invoices:', invoicesError);
        if (billsError) console.error('Error fetching bills:', billsError);
        
        if ((invoices && invoices.length > 0) || (bills && bills.length > 0)) {
          const cashFlowData = transformCashFlowData(invoices || [], bills || [], timeRange);
          setData(cashFlowData);
        } else {
          setData(getMockCashFlowData(timeRange));
        }
      } catch (error) {
        console.error('Error fetching cash flow data:', error);
        setData(getMockCashFlowData(timeRange));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  return { data, loading };
}
