
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { InvoiceForm } from '@/components/payments/InvoiceForm';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CreateInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract projectId from location state if available
    if (location.state && location.state.projectId) {
      setProjectId(location.state.projectId);
    }
  }, [location]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
        </div>
        
        <div className="dashboard-card">
          <InvoiceForm preselectedProjectId={projectId} />
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateInvoice;
