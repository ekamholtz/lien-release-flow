import React from 'react';
import { Button } from "@/components/ui/button";
import { useProjects } from '@/hooks/useProjects';

interface FinanceFiltersProps {
  onFilterChange: (projectId: string | null) => void;
  selectedProjectId: string | null;
}

// Make the component show both active projects and an "Unassigned" filter option
// This component should display filter buttons for "All", "Unassigned", and each active project.
// When a filter button is clicked, it should call the onFilterChange prop with the corresponding project ID or null for "All".

export function FinanceFilters({ onFilterChange, selectedProjectId }: FinanceFiltersProps) {
  const { projects } = useProjects();
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant={selectedProjectId === null ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange(null)}
      >
        All
      </Button>
      
      <Button
        variant={selectedProjectId === 'unassigned' ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange('unassigned')}
      >
        Unassigned
      </Button>
      
      {/* Project filters */}
      {projects.map((project) => (
        <Button
          key={project.id}
          variant={selectedProjectId === project.id ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(project.id)}
        >
          {project.name}
        </Button>
      ))}
    </div>
  );
}
