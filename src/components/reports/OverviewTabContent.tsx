import React, { useEffect, useState } from 'react';
import { CashFlowChart } from './CashFlowChart';
import { ExpensesByCategoryChart } from './ExpensesByCategoryChart';
import { ProjectProfitabilityChart } from './ProjectProfitabilityChart';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewTabContentProps {
  timeRange: string;
  cashFlowData?: any[];
  expensesByCategory?: any[];
  projectProfitability?: any[];
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  timeRange,
  cashFlowData,
  expensesByCategory,
  projectProfitability
}) => {
  const [loading, setLoading] = useState(true);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
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
        
        const cashFlowData = transformCashFlowData(invoices || [], bills || [], timeRange);
        setCashFlow(cashFlowData);
        
        const { data: expenseData, error: expenseError } = await supabase
          .from('bills')
          .select('amount, vendor_name')
          .gte('created_at', startDate.toISOString());
          
        if (expenseError) console.error('Error fetching expenses:', expenseError);
        
        const expensesByCategory = calculateExpensesByCategory(expenseData || []);
        setExpenses(expensesByCategory);
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, value');
          
        if (projectsError) console.error('Error fetching projects:', projectsError);
        
        const projectProfitData = await calculateProjectProfitability(projectsData || []);
        setProjects(projectProfitData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);
  
  const displayCashFlow = cashFlow.length > 0 ? cashFlow : cashFlowData || getMockCashFlowData(timeRange);
  const displayExpenses = expenses.length > 0 ? expenses : expensesByCategory || getMockExpensesData();
  const displayProjects = projects.length > 0 ? projects : projectProfitability || getMockProjectData();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[350px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CashFlowChart data={displayCashFlow} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpensesByCategoryChart data={displayExpenses} />
        <ProjectProfitabilityChart data={displayProjects} />
      </div>
    </div>
  );
};

function getStartDateFromTimeRange(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

function transformCashFlowData(invoices: any[], bills: any[], timeRange: string): any[] {
  const segments = createDateSegments(timeRange);
  
  const result = segments.map(segment => ({
    name: segment.label,
    Incoming: 0,
    Outgoing: 0
  }));
  
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.created_at);
    const segmentIndex = findSegmentIndex(invoiceDate, segments);
    
    if (segmentIndex !== -1 && invoice.status === 'paid') {
      result[segmentIndex].Incoming += Number(invoice.amount);
    }
  });
  
  bills.forEach(bill => {
    const billDate = new Date(bill.created_at);
    const segmentIndex = findSegmentIndex(billDate, segments);
    
    if (segmentIndex !== -1 && bill.status === 'paid') {
      result[segmentIndex].Outgoing += Number(bill.amount);
    }
  });
  
  return result;
}

function createDateSegments(timeRange: string): Array<{start: Date, end: Date, label: string}> {
  const now = new Date();
  const segments = [];
  
  switch (timeRange) {
    case 'week':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        segments.push({
          start: dayStart,
          end: dayEnd,
          label: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      break;
    case 'month':
      for (let i = 4; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        segments.push({
          start: startDate,
          end: endDate,
          label: `Week ${4-i+1}`
        });
      }
      break;
    case 'quarter':
    case 'year':
      const monthCount = timeRange === 'quarter' ? 3 : 12;
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        segments.push({
          start: monthStart,
          end: monthEnd,
          label: date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
      break;
    default:
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        segments.push({
          start: monthStart,
          end: monthEnd,
          label: date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
  }
  
  return segments;
}

function findSegmentIndex(date: Date, segments: Array<{start: Date, end: Date, label: string}>): number {
  return segments.findIndex(segment => 
    date >= segment.start && date <= segment.end
  );
}

function calculateExpensesByCategory(expenses: any[]): any[] {
  const vendorTotals: Record<string, number> = {};
  let grandTotal = 0;
  
  expenses.forEach(expense => {
    const vendor = expense.vendor_name || 'Other';
    vendorTotals[vendor] = (vendorTotals[vendor] || 0) + Number(expense.amount);
    grandTotal += Number(expense.amount);
  });
  
  const result = Object.entries(vendorTotals)
    .map(([name, total]) => ({
      name,
      value: Math.round((total / grandTotal) * 100) || 0
    }))
    .sort((a, b) => b.value - a.value);
  
  if (result.length > 4) {
    const top4 = result.slice(0, 4);
    const others = result.slice(4).reduce(
      (acc, curr) => acc + curr.value,
      0
    );
    
    return [
      ...top4,
      { name: 'Others', value: others }
    ];
  }
  
  return result.length > 0 ? result : getMockExpensesData();
}

async function calculateProjectProfitability(projects: any[]): Promise<any[]> {
  if (projects.length === 0) return getMockProjectData();
  
  const result = [];
  
  for (const project of projects) {
    const projectId = project.id;
    
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('amount, status')
      .eq('project_id', projectId)
      .eq('status', 'paid');
      
    if (invoicesError) console.error(`Error fetching invoices for project ${projectId}:`, invoicesError);
    
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('amount, status')
      .eq('project_id', projectId)
      .eq('status', 'paid');
      
    if (billsError) console.error(`Error fetching bills for project ${projectId}:`, billsError);
    
    const revenue = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
    const expenses = (bills || []).reduce((sum, bill) => sum + Number(bill.amount), 0);
    const profit = revenue - expenses;
    
    result.push({
      name: project.name,
      profit: profit
    });
  }
  
  return result.sort((a, b) => b.profit - a.profit);
}

function getMockCashFlowData(timeRange: string) {
  const dataPoints = timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 30 :
                    timeRange === 'quarter' ? 12 : 
                    timeRange === 'year' ? 12 : 6;
  
  const result = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const incoming = Math.floor(Math.random() * 50000) + 10000;
    const outgoing = Math.floor(Math.random() * 40000) + 8000;
    
    result.push({
      name: timeRange === 'week' ? `Day ${i+1}` : 
            timeRange === 'month' ? `Week ${Math.floor(i/7) + 1}` :
            timeRange === 'quarter' ? `Month ${i+1}` :
            timeRange === 'year' ? `Month ${i+1}` : `Period ${i+1}`,
      Incoming: incoming,
      Outgoing: outgoing
    });
  }
  
  return result;
}

function getMockExpensesData() {
  return [
    { name: 'Materials', value: 35 },
    { name: 'Labor', value: 40 },
    { name: 'Equipment', value: 15 },
    { name: 'Admin', value: 10 }
  ];
}

function getMockProjectData() {
  return [
    { name: 'Project A', profit: 12000 },
    { name: 'Project B', profit: 8500 },
    { name: 'Project C', profit: 15000 },
    { name: 'Project D', profit: 10200 },
    { name: 'Project E', profit: 7800 }
  ];
}
