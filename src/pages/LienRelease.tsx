
import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { LienReleaseForm } from '@/components/payments/LienReleaseForm';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

const LienRelease = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center mb-6">
                <h1 className="text-2xl font-bold">Create Lien Release</h1>
                <div className="ml-auto">
                  <SidebarTrigger />
                </div>
              </div>
              
              <div className="dashboard-card">
                <LienReleaseForm />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <AiAssistant />
    </div>
  );
};

export default LienRelease;
