
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectOverview } from './ProjectOverview';
import { ProjectTransactions } from './ProjectTransactions';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import { ProjectMilestonesTab } from './ProjectMilestonesTab';
import { DbProject } from '@/lib/supabase';

interface ProjectDashboardTabsProps {
  project: DbProject;
  defaultTab?: 'overview' | 'milestones' | 'transactions' | 'documents';
}

export function ProjectDashboardTabs({ project, defaultTab = 'overview' }: ProjectDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => setActiveTab(value as 'overview' | 'milestones' | 'transactions' | 'documents')} 
      className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      
      <div className="bg-white shadow rounded-lg w-full">
        {/* Set a fixed height container with overflow for scrolling */}
        <div className="h-[700px] w-full overflow-y-auto">
          <TabsContent value="overview" className="p-6 min-w-full">
            <ProjectOverview project={project} />
          </TabsContent>
          
          <TabsContent value="milestones" className="p-6 min-w-full">
            <ProjectMilestonesTab projectId={project.id} />
          </TabsContent>
          
          <TabsContent value="transactions" className="p-6 min-w-full">
            <ProjectTransactions project={project} />
          </TabsContent>
          
          <TabsContent value="documents" className="p-6 min-w-full">
            <ProjectDocumentsTab projectId={project.id} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
