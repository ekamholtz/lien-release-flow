
import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { LienReleaseForm } from '@/components/payments/LienReleaseForm';
import { AiAssistant } from '@/components/dashboard/AiAssistant';

const LienRelease = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Create Lien Release</h1>
              <p className="text-gray-500 mt-1">Generate a lien release document for electronic signature</p>
            </div>
            
            <div className="dashboard-card">
              <LienReleaseForm />
            </div>
          </div>
        </main>
      </div>
      <AiAssistant />
    </div>
  );
};

export default LienRelease;
