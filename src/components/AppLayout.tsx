
import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset } from './ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <SidebarProvider>
        <div className="flex-1 flex">
          <AppSidebar />
          <div className="flex-1">
            <SidebarInset className="min-h-[calc(100vh-4rem)] bg-gray-50 w-full">
              {children}
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
