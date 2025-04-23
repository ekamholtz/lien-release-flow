
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectOverview } from '@/components/projects/ProjectOverview';
import { ProjectTransactions } from '@/components/projects/ProjectTransactions';
import { ProjectDocuments } from '@/components/projects/ProjectDocuments';
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
        
        <div className="grid grid-cols-1 gap-6 mt-6">
          <ProjectOverview project={project} />
          <ProjectTransactions project={project} />
          <ProjectDocuments project={project} />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDashboard;
