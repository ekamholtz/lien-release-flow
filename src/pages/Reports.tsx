
import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { 
  SidebarProvider, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ReportsHeader } from '@/components/reports/ReportsHeader';
import { OverviewTabContent } from '@/components/reports/OverviewTabContent';
import { ComingSoonCard } from '@/components/reports/ComingSoonCard';

// Sample data for charts
const cashFlowData = [
  { name: 'Jan', Incoming: 4000, Outgoing: 2400 },
  { name: 'Feb', Incoming: 3000, Outgoing: 1398 },
  { name: 'Mar', Incoming: 2000, Outgoing: 9800 },
  { name: 'Apr', Incoming: 2780, Outgoing: 3908 },
  { name: 'May', Incoming: 1890, Outgoing: 4800 },
  { name: 'Jun', Incoming: 2390, Outgoing: 3800 },
  { name: 'Jul', Incoming: 3490, Outgoing: 4300 },
];

const expensesByCategory = [
  { name: 'Materials', value: 35 },
  { name: 'Labor', value: 45 },
  { name: 'Equipment', value: 15 },
  { name: 'Admin', value: 5 },
];

const projectProfitability = [
  { name: 'Week 1', profit: 4000 },
  { name: 'Week 2', profit: 3500 },
  { name: 'Week 3', profit: 5000 },
  { name: 'Week 4', profit: 2780 },
  { name: 'Week 5', profit: 4890 },
  { name: 'Week 6', profit: 3390 },
  { name: 'Week 7', profit: 4490 },
];

const Reports = () => {
  const [timeRange, setTimeRange] = useState('month');
  
  const handleExport = (format: string) => {
    toast({
      title: "Export initiated",
      description: `Exporting report as ${format.toUpperCase()}.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto bg-gray-50 p-4 md:p-6 w-full">
            <div className="max-w-7xl mx-auto">
              <ReportsHeader 
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                handleExport={handleExport}
              />
              
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 md:w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="ap">Accounts Payable</TabsTrigger>
                  <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <OverviewTabContent 
                    cashFlowData={cashFlowData}
                    expensesByCategory={expensesByCategory}
                    projectProfitability={projectProfitability}
                  />
                </TabsContent>
                
                <TabsContent value="ap" className="space-y-6">
                  <ComingSoonCard 
                    title="Accounts Payable Aging" 
                    description="Outstanding payments by age" 
                  />
                </TabsContent>
                
                <TabsContent value="ar" className="space-y-6">
                  <ComingSoonCard 
                    title="Accounts Receivable Aging" 
                    description="Outstanding receivables by age" 
                  />
                </TabsContent>
                
                <TabsContent value="projects" className="space-y-6">
                  <ComingSoonCard 
                    title="Project Financials" 
                    description="Financial performance by project" 
                  />
                </TabsContent>
              </Tabs>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Reports;
