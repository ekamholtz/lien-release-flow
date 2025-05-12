
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { ProjectBasicInfoFormValues } from './types';
import { ClientSelector } from '@/components/clients/ClientSelector';
import { ProjectManagerSelector } from '@/components/projects/ProjectManagerSelector';

interface ProjectInfoFieldsProps {
  form: UseFormReturn<ProjectBasicInfoFormValues>;
}

export function ProjectInfoFields({ form }: ProjectInfoFieldsProps) {
  const { user } = useAuth();

  // Set current user as project manager by default when form initializes
  useEffect(() => {
    const currentProjectManager = form.getValues().projectManagerId;
    if (!currentProjectManager && user?.id) {
      form.setValue('projectManagerId', user.id);
    }
  }, [form, user]);

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter project name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="clientId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client *</FormLabel>
            <FormControl>
              <ClientSelector value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="projectManagerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Manager *</FormLabel>
            <FormControl>
              <ProjectManagerSelector value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="Enter project location" {...field} />
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
            <FormLabel>Contract Value *</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter contract value" 
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
