
import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

const Settings = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center mb-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <div className="ml-auto">
                  <SidebarTrigger />
                </div>
              </div>
              
              <div className="space-y-6">
                <SettingsTabs />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Settings;
