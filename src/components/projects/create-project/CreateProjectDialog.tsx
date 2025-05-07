
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import { ProjectForm } from './ProjectForm';
import { ProjectFormValues } from './projectFormSchema';
import { createDraftProject, getClientName } from './projectService';

export interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  onProjectCreated
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch project types
  const { data: projectTypes = [] } = useQuery({
    queryKey: ["project-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_types")
        .select("*")
        .eq("is_active", true)
        .order("name");
        
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!user) {
      toast.error("You must be logged in to create a project");
      return;
    }
    
    if (!currentCompany?.id) {
      toast.error("No company selected. Please select a company first.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Creating project with company ID:", currentCompany.id);
      
      // First, get the client name for the legacy client field
      const clientName = await getClientName(values.clientId);
      
      // Create the project
      const project = await createDraftProject({
        ...values,
        companyId: currentCompany.id,
        clientName
      });

      toast.success("Project draft saved");
      
      onClose();
      
      if (onProjectCreated && project) {
        onProjectCreated(project.id);
      } else if (project) {
        navigate(`/projects/new?id=${project.id}`);
      }
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        
        <ProjectForm
          projectTypes={projectTypes}
          onSubmit={handleSubmit}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
