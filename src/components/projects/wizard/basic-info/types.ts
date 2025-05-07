
import { z } from 'zod';

export const projectBasicInfoSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientId: z.string().min(1, 'Client is required'),
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be a positive number'),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  projectTypeId: z.string().min(1, 'Project type is required'),
});

export type ProjectBasicInfoFormValues = z.infer<typeof projectBasicInfoSchema>;
