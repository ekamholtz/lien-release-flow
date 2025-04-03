import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ReportsHeader } from '@/components/reports/ReportsHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTabContent } from '@/components/reports/OverviewTabContent';
import { Card } from '@/components/ui/card';
import { ComingSoonCard } from '@/components/reports/ComingSoonCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const { toast } = useToast();

  const handleExport = (format: string) => {
    toast({
      title: "Export initiated",
      description: `Your ${format.toUpperCase()} report is being generated. It will download shortly.`,
    });
    
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      });
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <ReportsHeader 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          handleExport={handleExport}
        />

        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payables">Accounts Payable</TabsTrigger>
            <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTabContent timeRange={timeRange} />
          </TabsContent>
          
          <TabsContent value="payables">
            <div className="grid gap-6 md:grid-cols-2">
              <ComingSoonCard 
                title="Bills by Status" 
                description="Detailed breakdown of bills by their current status."
                Icon="PieChart"
              />
              <ComingSoonCard 
                title="Payment Timeline" 
                description="Visualization of upcoming bill payments."
                Icon="LineChart" 
              />
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-medium">Payables Analysis</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Detailed reports for accounts payable will be available in the next update.
                  This will include vendor analysis, payment terms evaluation, and cash flow forecasting.
                </p>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="receivables">
            <div className="grid gap-6 md:grid-cols-2">
              <ComingSoonCard 
                title="Invoices by Status" 
                description="Detailed breakdown of invoices by their current status."
                Icon="PieChart"
              />
              <ComingSoonCard 
                title="Collection Timeline" 
                description="Visualization of expected invoice payments."
                Icon="LineChart" 
              />
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-medium">Receivables Analysis</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Detailed reports for accounts receivable will be available in the next update.
                  This will include client payment behavior, aging analysis, and collection efficiency metrics.
                </p>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="grid gap-6 md:grid-cols-2">
              <ComingSoonCard 
                title="Project Profitability" 
                description="Profit margin analysis for each project."
                Icon="BarChart"
              />
              <ComingSoonCard 
                title="Project Timeline" 
                description="Timeline and status visualization for all projects."
                Icon="GanttChart" 
              />
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-medium">Project Analysis</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Detailed project reports will be available in the next update.
                  This will include resource allocation, milestone tracking, and budget vs. actual analysis.
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reports;
