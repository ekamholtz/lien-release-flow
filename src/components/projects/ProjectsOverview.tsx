
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ProjectsOverview() {
  const { data: stats } = useQuery({
    queryKey: ['projects-stats'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('status, value');
      
      return {
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter(p => p.status === 'active').length || 0,
        totalValue: projects?.reduce((sum, p) => sum + (p.value || 0), 0) || 0,
        completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
        draftProjects: projects?.filter(p => p.status === 'draft').length || 0,
      };
    }
  });

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
          {stats?.draftProjects ? (
            <p className="text-xs text-gray-500">{stats.draftProjects} draft projects</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats?.totalValue.toLocaleString() || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Completed Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completedProjects || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
