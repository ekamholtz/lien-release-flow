
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';

export function ProjectsList() {
  const navigate = useNavigate();
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      // Type assertion to handle the potentially missing company_id field
      return data as unknown as DbProject[];
    }
  });

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
