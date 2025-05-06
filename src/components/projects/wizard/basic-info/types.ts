
import { z } from 'zod';

export const projectBasicInfoSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client: z.string().min(1, 'Client name is required'),
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be a positive number'),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  projectTypeId: z.string().optional(),
});

export type ProjectBasicInfoFormValues = z.infer<typeof projectBasicInfoSchema>;
