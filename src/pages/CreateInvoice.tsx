
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { InvoiceForm } from '@/components/payments/InvoiceForm';

const CreateInvoice = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>
        
        <div className="dashboard-card">
          <InvoiceForm />
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateInvoice;
