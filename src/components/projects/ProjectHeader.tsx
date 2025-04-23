
import React from 'react';
import { format } from 'date-fns';
import type { DbProject } from '@/lib/supabase';

interface ProjectHeaderProps {
  project: DbProject;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500">Client: {project.client}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Project Value</p>
          <p className="text-2xl font-semibold">${project.value.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-sm text-gray-500">
        <p>Start Date: {format(new Date(project.start_date), 'MMM d, yyyy')}</p>
        {project.end_date && (
          <p>End Date: {format(new Date(project.end_date), 'MMM d, yyyy')}</p>
        )}
        <p className="ml-auto">Status: {project.status}</p>
      </div>
    </div>
  );
}
