
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProjectWizard } from '@/components/projects/ProjectWizard';

const CreateProject = () => {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>
        
        <div className="dashboard-card">
          <ProjectWizard />
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateProject;
