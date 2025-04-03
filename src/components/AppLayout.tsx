
import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="flex flex-col flex-1 md:ml-60">
        <AppHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
