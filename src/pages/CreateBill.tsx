
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { BillForm } from '@/components/payments/BillForm';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CreateBill = () => {
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
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Create Bill</h1>
        </div>
        
        <div className="dashboard-card max-w-3xl mx-auto">
          <BillForm preselectedProjectId={projectId} />
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateBill;
