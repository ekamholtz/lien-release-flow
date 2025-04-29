
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProjectWizard } from '@/components/projects/ProjectWizard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CreateProject = () => {
  const location = useLocation();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extract project ID from URL query parameters
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      setProjectId(id);
      console.log(`Loading project with ID: ${id}`);
    }
  }, [location.search]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>
        
        <div className="dashboard-card">
          <ProjectWizard initialProjectId={projectId} />
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateProject;
