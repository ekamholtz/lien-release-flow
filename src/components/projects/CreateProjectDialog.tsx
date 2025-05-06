import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  client: z.string().min(1, "Client name is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  projectTypeId: z.string().min(1, "Project type is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateProjectDialog({
  isOpen,
  onClose,
  onProjectCreated
}: {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
}) {
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      client: "",
      value: 0,
      projectTypeId: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
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
      
      // Create draft project with minimal info
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: values.name,
          client: values.client,
          value: values.value,
          project_type_id: values.projectTypeId,
          start_date: new Date().toISOString().split('T')[0],
          status: "draft",
          company_id: currentCompany.id // Add company ID to the project
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Project draft saved");
      form.reset();
      onClose();
      
      if (onProjectCreated && project) {
        onProjectCreated(project.id);
      } else if (project) {
        navigate(`/projects/new?id=${project.id}`);
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(`Failed to create project: ${error.message}`);
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Value*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  form.handleSubmit((values) => {
                    handleSubmit(values).then(() => {
                      navigate('/projects');
                    });
                  })();
                }}
                disabled={isSubmitting}
              >
                Skip for Later
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                Next
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
