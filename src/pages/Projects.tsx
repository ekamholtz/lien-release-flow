
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProjectsOverview } from '@/components/projects/ProjectsOverview';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { ProjectFilters } from '@/components/projects/ProjectFilters';

const Projects = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <ProjectsOverview />
        <ProjectFilters />
        <ProjectsList />
      </div>
    </AppLayout>
  );
};

export default Projects;
