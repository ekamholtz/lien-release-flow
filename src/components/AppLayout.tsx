
import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset } from './ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader />
          <SidebarInset className="bg-gray-50">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
