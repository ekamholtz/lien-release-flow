
import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { PendingApprovals } from '@/components/dashboard/PendingApprovals';
import { FinanceFilters } from '@/components/finance/FinanceFilters';

const Dashboard = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const handleFilterChange = (projectId: string | null) => {
    setSelectedProjectId(projectId);
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
            selectedProjectId={selectedProjectId} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentTransactions projectId={selectedProjectId} />
            <PendingApprovals projectId={selectedProjectId} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
