
import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

const AccountsReceivable = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center mb-6">
                <h1 className="text-2xl font-bold">Accounts Receivable</h1>
                <div className="ml-auto">
                  <SidebarTrigger />
                </div>
              </div>
              
              <div className="dashboard-card mb-6">
                <h2 className="text-lg font-semibold mb-4">Outstanding Invoices</h2>
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-800">
                  <p>No outstanding invoices to display. Use the "Create Invoice" option to create new invoices.</p>
                </div>
              </div>
              
              <div className="dashboard-card">
                <h2 className="text-lg font-semibold mb-4">Invoice History</h2>
                <div className="rounded-md border">
                  <div className="p-8 text-center text-gray-500">
                    <p>Your invoice history will appear here once invoices have been sent.</p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <AiAssistant />
    </div>
  );
};

export default AccountsReceivable;
