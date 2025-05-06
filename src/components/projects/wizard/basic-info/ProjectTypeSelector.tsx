
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProjectType } from '@/types/project';
import { UseFormReturn } from 'react-hook-form';
import { ProjectBasicInfoFormValues } from './types';

interface ProjectTypeSelectorProps {
  form: UseFormReturn<ProjectBasicInfoFormValues>;
  projectTypes: ProjectType[];
  onCreateProjectType: () => void;
}

export function ProjectTypeSelector({
  form,
  projectTypes,
  onCreateProjectType
}: ProjectTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="projectTypeId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project Type</FormLabel>
          <div className="flex space-x-2">
            <FormControl>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={onCreateProjectType}
            >
              +
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
