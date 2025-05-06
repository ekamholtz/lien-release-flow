
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { ProjectType } from '@/types/project';
import { useQuery } from '@tanstack/react-query';
import { ProjectTypeSelector } from './basic-info/ProjectTypeSelector';
import { ProjectInfoFields } from './basic-info/ProjectInfoFields';
import { DateSelectionFields } from './basic-info/DateSelectionFields';
import { ContactInfoFields } from './basic-info/ContactInfoFields';
import { DescriptionField } from './basic-info/DescriptionField';
import { CreateProjectTypeDialog } from './CreateProjectTypeDialog';
import { projectBasicInfoSchema, ProjectBasicInfoFormValues } from './basic-info/types';

interface ProjectBasicInfoProps {
  initialData?: Partial<ProjectBasicInfoFormValues>;
  onSubmit: (data: ProjectBasicInfoFormValues) => void;
}

export function ProjectBasicInfo({ initialData, onSubmit }: ProjectBasicInfoProps) {
  const [showCreateTypeDialog, setShowCreateTypeDialog] = useState(false);

  const { data: projectTypes = [], refetch: refetchProjectTypes } = useQuery({
    queryKey: ['project-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      return data as ProjectType[] || [];
    }
  });

  const form = useForm<ProjectBasicInfoFormValues>({
    resolver: zodResolver(projectBasicInfoSchema),
    defaultValues: {
      name: initialData?.name || '',
      client: initialData?.client || '',
      location: initialData?.location || '',
      contactName: initialData?.contactName || '',
      contactEmail: initialData?.contactEmail || '',
      contactPhone: initialData?.contactPhone || '',
      description: initialData?.description || '',
      value: initialData?.value || 0,
      startDate: initialData?.startDate || new Date(),
      endDate: initialData?.endDate || null,
      projectTypeId: initialData?.projectTypeId || undefined,
    },
  });

  const handleCreateProjectType = () => {
    setShowCreateTypeDialog(true);
  };

  const handleProjectTypeCreated = () => {
    refetchProjectTypes();
    setShowCreateTypeDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Information</h3>
        <p className="text-sm text-muted-foreground">
          Enter the basic information about your project.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProjectInfoFields form={form} />
            
            <div className="flex flex-col space-y-6">
              <DateSelectionFields form={form} />
              <ProjectTypeSelector 
                form={form}
                projectTypes={projectTypes}
                onCreateProjectType={handleCreateProjectType}
              />
            </div>
          </div>
          
          <ContactInfoFields form={form} />
          
          <DescriptionField form={form} />
          
          <div className="flex justify-end">
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
      
      <CreateProjectTypeDialog 
        open={showCreateTypeDialog} 
        onOpenChange={setShowCreateTypeDialog} 
        onSuccess={handleProjectTypeCreated}
      />
    </div>
  );
}
