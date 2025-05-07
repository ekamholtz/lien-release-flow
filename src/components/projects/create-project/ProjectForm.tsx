
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClientSelector } from '@/components/clients/ClientSelector';
import { projectFormSchema, ProjectFormValues } from "./projectFormSchema";
import { useNavigate } from "react-router-dom";

interface ProjectFormProps {
  projectTypes: Array<{ id: string, name: string }>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export function ProjectForm({
  projectTypes,
  onSubmit,
  onClose,
  isSubmitting
}: ProjectFormProps) {
  const navigate = useNavigate();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      clientId: "",
      value: 0,
      projectTypeId: "",
    },
  });

  const handleSubmit = async (values: ProjectFormValues) => {
    await onSubmit(values);
  };

  return (
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
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client*</FormLabel>
              <FormControl>
                <ClientSelector value={field.value} onChange={field.onChange} />
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
        
        <div className="flex justify-end gap-2 pt-4">
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
        </div>
      </form>
    </Form>
  );
}
