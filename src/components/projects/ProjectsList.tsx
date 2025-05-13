
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';
import { useCompany } from '@/contexts/CompanyContext';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsList() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DbProject[];
    },
    enabled: !!currentCompany?.id
  });

  // Fetch milestone data for all projects to calculate completion percentage
  const { data: projectMilestones } = useQuery({
    queryKey: ['projects-milestones', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id || projects.length === 0) {
        return {};
      }
      
      const projectIds = projects.map(p => p.id);
      
      const { data, error } = await supabase
        .from('milestones')
        .select('project_id, is_completed')
        .in('project_id', projectIds);
        
      if (error) throw error;
      
      // Group milestones by project and calculate completion percentage
      const milestonesByProject = (data || []).reduce((acc, milestone) => {
        if (!acc[milestone.project_id]) {
          acc[milestone.project_id] = { total: 0, completed: 0 };
        }
        
        acc[milestone.project_id].total += 1;
        if (milestone.is_completed) {
          acc[milestone.project_id].completed += 1;
        }
        
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);
      
      return milestonesByProject;
    },
    enabled: !!currentCompany?.id && projects.length > 0
  });

  // Calculate completion percentage for a project
  const getCompletionPercentage = (projectId: string) => {
    if (!projectMilestones || !projectMilestones[projectId]) {
      return 0;
    }
    
    const { total, completed } = projectMilestones[projectId];
    if (total === 0) return 0;
    
    return Math.round((completed / total) * 100);
  };

  if (!currentCompany?.id) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please select a company to view projects</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No projects found. Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const completionPercentage = getCompletionPercentage(project.id);
        return (
          <Card 
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <CardHeader>
              <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client:</span>
                  <span className="font-medium">{project.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Value:</span>
                  <span className="font-medium">${project.value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium capitalize">{project.status}</span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <Progress 
                    value={completionPercentage} 
                    className="h-2 w-full shadow-sm" 
                    indicatorClassName={
                      completionPercentage === 100 
                        ? "bg-green-500" 
                        : completionPercentage > 0 
                          ? "bg-blue-500" 
                          : ""
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
