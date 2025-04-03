
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { LienReleaseForm } from '@/components/payments/LienReleaseForm';
import { AiAssistant } from '@/components/dashboard/AiAssistant';

const LienRelease = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Lien Release</h1>
        
        <div className="dashboard-card">
          <LienReleaseForm />
        </div>
      </div>
      <AiAssistant />
    </AppLayout>
  );
};

export default LienRelease;
