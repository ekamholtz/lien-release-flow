
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CreateProjectDialog } from "./create-project/CreateProjectDialog";

interface ProjectSelectWithCreateProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectSelectWithCreate({ value, onChange }: ProjectSelectWithCreateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: projects = [], refetch } = useQuery({
    queryKey: ["active-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .or("status.eq.active,status.eq.draft")
        .order("name")
        .limit(50);
        
      if (error) throw error;
      return data;
    },
  });

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "create-new") {
      setIsDialogOpen(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleProjectCreated = (projectId: string) => {
    refetch().then(() => {
      onChange(projectId);
    });
  };

  return (
    <>
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="create-new" className="font-medium text-primary">
            <span className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New Project
            </span>
          </SelectItem>
          <SelectItem value="none">None (Unassigned)</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
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
