
import React from 'react';
import { CashFlowChart } from './CashFlowChart';
import { ExpensesByCategoryChart } from './ExpensesByCategoryChart';
import { ProjectProfitabilityChart } from './ProjectProfitabilityChart';

interface OverviewTabContentProps {
  cashFlowData: any[];
  expensesByCategory: any[];
  projectProfitability: any[];
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  cashFlowData,
  expensesByCategory,
  projectProfitability
}) => {
  return (
    <div className="space-y-6">
      <CashFlowChart data={cashFlowData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpensesByCategoryChart data={expensesByCategory} />
        <ProjectProfitabilityChart data={projectProfitability} />
      </div>
    </div>
  );
};
