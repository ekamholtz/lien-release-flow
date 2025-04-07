
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { CreateProjectDialog } from './CreateProjectDialog';

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { projects, loading, fetchProjects } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'create-new') {
      setIsDialogOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleProjectCreated = (newProjectId: string) => {
    // Refresh projects list
    fetchProjects();
    
    // Select the newly created project
    onChange(newProjectId);
  };

  return (
    <>
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading projects..." : "Select a project"} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
          <SelectItem value="create-new" className="text-primary font-medium">
            <span className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New Project
            </span>
          </SelectItem>
          {projects.length === 0 && !loading && (
            <SelectItem value="no-projects" disabled>
              No projects available
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <CreateProjectDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
