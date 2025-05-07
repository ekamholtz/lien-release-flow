
import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  clientId: z.string().min(1, "Client is required"),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  projectTypeId: z.string().min(1, "Project type is required"),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
