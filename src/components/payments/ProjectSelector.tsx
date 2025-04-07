
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

type Project = {
  id: string;
  name: string;
};

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'create-new') {
      setIsDialogOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          client: 'TBD', // Default value for required field
          value: 0, // Default value for required field
          status: 'active', // Default value
          start_date: new Date().toISOString().split('T')[0] // Default to today
        })
        .select();

      if (error) throw error;

      toast({
        title: "Project created",
        description: `Project ${newProjectName} has been created successfully.`
      });

      // Reset form
      setNewProjectName('');
      
      // Close dialog
      setIsDialogOpen(false);
      
      // Refresh projects list
      await fetchProjects();
      
      // Select the newly created project
      if (data && data[0]) {
        onChange(data[0].id);
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive"
      });
    }
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectName" className="text-right">
                Project Name*
              </Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
