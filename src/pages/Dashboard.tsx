
import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { PendingApprovals } from '@/components/dashboard/PendingApprovals';
import { AiAssistant } from '@/components/dashboard/AiAssistant';

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            
            <div className="space-y-6">
              <DashboardSummary />
              
              <div className="dashboard-card">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <ActionButtons />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecentTransactions />
                <PendingApprovals />
              </div>
            </div>
          </div>
        </main>
      </div>
      <AiAssistant />
    </div>
  );
};

export default Dashboard;
