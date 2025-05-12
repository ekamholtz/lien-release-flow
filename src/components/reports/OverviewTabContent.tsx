
import React from 'react';
import { CashFlowChart } from './CashFlowChart';
import { ExpensesByCategoryChart } from './ExpensesByCategoryChart';
import { ProjectProfitabilityChart } from './ProjectProfitabilityChart';
import { ReportSkeleton } from './ReportSkeleton';
import { getStartDateFromTimeRange } from './utils/timeRangeUtils';
import { useCashFlowData } from './hooks/useCashFlowData';
import { useExpensesByCategory } from './hooks/useExpensesByCategory';
import { useProjectProfitability } from './hooks/useProjectProfitability';

interface OverviewTabContentProps {
  timeRange: string;
  cashFlowData?: any[];
  expensesByCategory?: any[];
  projectProfitability?: any[];
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  timeRange,
  cashFlowData: initialCashFlowData,
  expensesByCategory: initialExpenseData,
  projectProfitability: initialProjectData
}) => {
  const startDate = getStartDateFromTimeRange(timeRange);
  
  // Fetch data using custom hooks
  const { data: cashFlowHookData, loading: cashFlowLoading } = useCashFlowData(timeRange);
  const { data: expensesHookData, loading: expensesLoading } = useExpensesByCategory(timeRange);
  const { data: projectsHookData, loading: projectsLoading } = useProjectProfitability(startDate);
  
  // Use provided data if available, otherwise use data from hooks
  const displayCashFlow = initialCashFlowData || cashFlowHookData;
  const displayExpenses = initialExpenseData || expensesHookData;
  const displayProjects = initialProjectData || projectsHookData;
  
  // Show loading skeleton if any data is still loading
  const isLoading = cashFlowLoading || expensesLoading || projectsLoading;
  
  if (isLoading) {
    return <ReportSkeleton />;
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
