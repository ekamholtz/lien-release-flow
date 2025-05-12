
import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { PendingApprovals } from '@/components/dashboard/PendingApprovals';
import { FinanceFilters, FinanceFiltersState } from '@/components/finance/FinanceFilters';

const Dashboard = () => {
  const [filters, setFilters] = useState<FinanceFiltersState>({
    projectId: null,
    dateRange: null,
    projectManagerId: null
  });
  
  const handleFilterChange = (newFilters: FinanceFiltersState) => {
    setFilters(newFilters);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="space-y-6">
          <DashboardSummary />
          
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <ActionButtons />
          </div>
          
          <FinanceFilters 
            onFilterChange={handleFilterChange} 
            selectedFilters={filters} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentTransactions 
              projectId={filters.projectId} 
              dateRange={filters.dateRange} 
              managerId={filters.projectManagerId} 
            />
            <PendingApprovals 
              projectId={filters.projectId} 
              dateRange={filters.dateRange} 
              managerId={filters.projectManagerId} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
