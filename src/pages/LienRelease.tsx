
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { LienReleaseForm } from '@/components/payments/LienReleaseForm';

const LienRelease = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Lien Release</h1>
        
        <div className="dashboard-card">
          <LienReleaseForm />
        </div>
      </div>
    </AppLayout>
  );
};

export default LienRelease;
