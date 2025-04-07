
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { DocumentsTab } from '@/components/documents/DocumentsTab';

const Documents = () => {
  return (
    <AppLayout>
      <div className="w-full p-6">
        <h1 className="text-2xl font-bold mb-6">Documents</h1>
        
        <div className="space-y-6 pb-10 max-w-5xl">
          <DocumentsTab />
        </div>
      </div>
    </AppLayout>
  );
};

export default Documents;
