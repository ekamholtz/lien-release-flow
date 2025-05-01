
import React from 'react';
import { format } from 'date-fns';
import { DbProject } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectHeaderProps {
  project: DbProject;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get appropriate badge color based on project status
  const getBadgeVariant = (status: string) => {
    switch(status) {
      case 'active':
        return 'default'; 
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format status text for display
  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge variant={getBadgeVariant(project.status)}>
          {getStatusText(project.status)}
        </Badge>
      </div>
      
      <Card className="bg-white">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Client</p>
            <p className="font-medium">{project.client}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Project Value</p>
            <p className="font-medium">{formatCurrency(project.value || 0)}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Start Date</p>
            <p className="font-medium">
              {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'Not set'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
