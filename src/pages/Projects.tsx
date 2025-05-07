
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProjectsOverview } from '@/components/projects/ProjectsOverview';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const Projects = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button onClick={handleCreateProject} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Project
          </Button>
        </div>
        <ProjectsOverview />
        <ProjectFilters />
        <ProjectsList />
      </div>
    </AppLayout>
  );
};

export default Projects;
