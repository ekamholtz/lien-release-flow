
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';

interface ProjectOverviewProps {
  project: DbProject;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const { data: stats } = useQuery({
    queryKey: ['project-stats', project.id],
    queryFn: async () => {
      const [invoices, bills] = await Promise.all([
        supabase
          .from('invoices')
          .select('amount, status')
          .eq('project_id', project.id),
        supabase
          .from('bills')
          .select('amount, status')
          .eq('project_id', project.id)
      ]);

      return {
        totalInvoiced: invoices.data?.reduce((sum, inv) => sum + inv.amount, 0) || 0,
        totalBilled: bills.data?.reduce((sum, bill) => sum + bill.amount, 0) || 0,
        invoicesCount: invoices.data?.length || 0,
        billsCount: bills.data?.length || 0
      };
    }
  });

  return (
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
  );
}
