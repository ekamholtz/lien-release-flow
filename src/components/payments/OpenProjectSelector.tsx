
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, AlertCircle } from 'lucide-react';
import { useOpenProjects } from '@/hooks/useOpenProjects';
import { CreateProjectDialog } from '../projects/create-project/CreateProjectDialog';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OpenProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function OpenProjectSelector({ value, onChange, placeholder = "Select a project" }: OpenProjectSelectorProps) {
  const { projects, loading, error, refetch } = useOpenProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'create-new') {
      setIsDialogOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleProjectCreated = (newProjectId: string) => {
    refetch();
    onChange(newProjectId);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load projects: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading projects..." : placeholder} />
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
              No open projects available
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
