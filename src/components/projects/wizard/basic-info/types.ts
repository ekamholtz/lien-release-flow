
import { z } from "zod";

// Schema for project creation/update form
export const projectBasicInfoSchema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  clientId: z.string().min(1, { message: "Client is required" }),
  projectManagerId: z.string().min(1, { message: "Project manager is required" }),
  projectTypeId: z.string().optional(),
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  value: z.number().min(0, { message: "Value must be a positive number" }),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
});

export type ProjectBasicInfoFormValues = z.infer<typeof projectBasicInfoSchema>;
