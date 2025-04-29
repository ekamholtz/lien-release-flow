
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectOverview } from './ProjectOverview';
import { ProjectTransactions } from './ProjectTransactions';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import { DbProject } from '@/lib/supabase';

interface ProjectDashboardTabsProps {
  project: DbProject;
}

export function ProjectDashboardTabs({ project }: ProjectDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <ProjectOverview project={project} />
      </TabsContent>
      
      <TabsContent value="transactions">
        <ProjectTransactions project={project} />
      </TabsContent>
      
      <TabsContent value="documents">
        <ProjectDocumentsTab projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
}
