
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { BillForm } from '@/components/payments/BillForm';
import { AiAssistant } from '@/components/dashboard/AiAssistant';

const CreateBill = () => {
  return (
    <AppLayout>
      <div className="w-full p-6">
        <h1 className="text-2xl font-bold mb-6">Create Bill</h1>
        
        <div className="dashboard-card max-w-3xl mx-auto">
          <BillForm />
        </div>
      </div>
      <AiAssistant />
    </AppLayout>
  );
};

export default CreateBill;
