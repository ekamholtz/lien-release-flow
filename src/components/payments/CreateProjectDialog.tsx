
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

export function CreateProjectDialog({ isOpen, onClose, onProjectCreated }: CreateProjectDialogProps) {
  const [newProjectName, setNewProjectName] = useState('');
  
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
      onClose();
      
      // Notify parent component
      if (data && data[0]) {
        onProjectCreated(data[0].id);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
