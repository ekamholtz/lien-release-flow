
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, Phone, Mail, User } from 'lucide-react';
import type { DbProject } from '@/lib/supabase';

interface ProjectOverviewProps {
  project: DbProject;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const { data: stats } = useQuery({
    queryKey: ['project-stats', project.id],
    queryFn: async () => {
      const [invoices, bills, milestones] = await Promise.all([
        supabase
          .from('invoices')
          .select('amount, status')
          .eq('project_id', project.id),
        supabase
          .from('bills')
          .select('amount, status')
          .eq('project_id', project.id),
        supabase
          .from('milestones')
          .select('amount, is_completed')
          .eq('project_id', project.id)
      ]);

      return {
        totalInvoiced: invoices.data?.reduce((sum, inv) => sum + inv.amount, 0) || 0,
        totalBilled: bills.data?.reduce((sum, bill) => sum + bill.amount, 0) || 0,
        invoicesCount: invoices.data?.length || 0,
        billsCount: bills.data?.length || 0,
        milestonesCount: milestones.data?.length || 0,
        completedMilestones: milestones.data?.filter(m => m.is_completed).length || 0
      };
    }
  });

  return (
    <div className="space-y-6">
      {/* Financial metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalInvoiced.toLocaleString()}</div>
            <p className="text-xs text-gray-500">{stats?.invoicesCount} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalBilled.toLocaleString()}</div>
            <p className="text-xs text-gray-500">{stats?.billsCount} bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.totalInvoiced || 0) - (stats?.totalBilled || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Project Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${project.value.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Total contract value</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Project details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Dates */}
            <div className="flex items-start gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Project Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(project.start_date), 'MMM d, yyyy')} 
                  {project.end_date && ` - ${format(new Date(project.end_date), 'MMM d, yyyy')}`}
                </p>
              </div>
            </div>
            
            {/* Project Location */}
            {project.location && (
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{project.location}</p>
                </div>
              </div>
            )}
            
            {/* Project Description */}
            {project.description && (
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Project Contact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Client Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base font-medium">{project.client}</p>
            
            {project.contact_name && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{project.contact_name}</p>
                </div>
              </div>
            )}
            
            {project.contact_email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{project.contact_email}</p>
                </div>
              </div>
            )}
            
            {project.contact_phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{project.contact_phone}</p>
                </div>
              </div>
            )}
            
            {!project.contact_name && !project.contact_email && !project.contact_phone && (
              <p className="text-sm text-muted-foreground">No contact information available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestone Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completedMilestones || 0}/{stats?.milestonesCount || 0}</div>
          <p className="text-xs text-gray-500">Completed Milestones</p>
        </CardContent>
      </Card>
    </div>
  );
}
