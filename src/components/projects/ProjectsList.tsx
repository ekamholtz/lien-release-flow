
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';
import { useCompany } from '@/contexts/CompanyContext';

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
      {projects.map((project) => (
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
