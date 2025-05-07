
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectOverview } from './ProjectOverview';
import { ProjectTransactions } from './ProjectTransactions';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import { ProjectMilestonesTab } from './ProjectMilestonesTab';
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
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      
      <div className="bg-white shadow rounded-lg">
        <TabsContent value="overview" className="p-6">
          <ProjectOverview project={project} />
        </TabsContent>
        
        <TabsContent value="milestones" className="p-6">
          <ProjectMilestonesTab projectId={project.id} />
        </TabsContent>
        
        <TabsContent value="transactions" className="p-6">
          <ProjectTransactions project={project} />
        </TabsContent>
        
        <TabsContent value="documents" className="p-6">
          <ProjectDocumentsTab projectId={project.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
