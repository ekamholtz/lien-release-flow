
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectDashboardTabs } from '@/components/projects/ProjectDashboardTabs';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectDashboardProps {
  documentsOnly?: boolean;
}

const ProjectDashboard = ({ documentsOnly = false }: ProjectDashboardProps) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(projectId);

  const handleContinueSetup = () => {
    if (project && project.id) {
      navigate(`/projects/create?id=${project.id}`);
      toast.success("Continuing project setup");
    }
  };

  const handleEditProject = () => {
    if (project && project.id) {
      navigate(`/projects/${project.id}/edit-options`);
      toast.success("Editing project");
    }
  };

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
        {/* Navigation Row */}
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </div>
        
        {/* Project Info and Actions Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <ProjectHeader project={project} />
          
          {project.status === 'draft' ? (
            <Button 
              className="mt-4 sm:mt-0"
              onClick={handleContinueSetup}
            >
              Continue Setup <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              className="mt-4 sm:mt-0"
              variant="outline"
              onClick={handleEditProject}
            >
              Edit Project <Edit className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="mt-6">
          {documentsOnly ? (
            <ProjectDashboardTabs project={project} defaultTab="documents" />
          ) : (
            <ProjectDashboardTabs project={project} />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDashboard;
