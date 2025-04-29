
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectDashboardTabs } from '@/components/projects/ProjectDashboardTabs';
import { useProject } from '@/hooks/useProject';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { project, loading, error } = useProject(projectId);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading project details...</div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <ProjectHeader project={project} />
        
        <div className="mt-6">
          <ProjectDashboardTabs project={project} />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDashboard;
