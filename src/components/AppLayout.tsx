
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { CreateProjectDialog } from './projects/CreateProjectDialog';
import { Toaster } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Add global keyboard shortcut for project creation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsProjectDialogOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Mobile sidebar backdrop */}
        {!isSidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 ease-in-out bg-white border-r lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <AppSidebar />
        </div>
        
        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            {children}
          </main>
        </div>
        
        {/* Project creation dialog */}
        <CreateProjectDialog 
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
        />
        
        {/* Toast container */}
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>
  );
}
