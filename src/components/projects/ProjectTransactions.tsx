
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { BillsTable } from '@/components/payments/BillsTable';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProject } from '@/lib/supabase';

interface ProjectTransactionsProps {
  project: DbProject;
}

export function ProjectTransactions({ project }: ProjectTransactionsProps) {
  const { data: invoices = [] } = useQuery({
    queryKey: ['project-invoices', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, projects(name)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['project-bills', project.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bills')
        .select('*, projects(name)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Transactions</h2>
      
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="bills">Bills ({bills.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="mt-4">
          <InvoicesTable 
            invoices={invoices} 
            onUpdateStatus={() => {}} 
            onPayInvoice={() => {}}
            onViewDetails={() => {}}
          />
        </TabsContent>
        
        <TabsContent value="bills" className="mt-4">
          <BillsTable 
            bills={bills}
            onUpdateStatus={() => {}}
            onPayBill={() => {}}
            onViewDetails={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
