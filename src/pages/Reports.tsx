
import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, PieChart, AreaChart } from '@/components/ui/chart';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Download,
  FileText,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Financial Reports</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="month" onValueChange={setTimeRange}>
                      <SelectTrigger className="w-36">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <SidebarTrigger />
                </div>
              </div>
              
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 md:w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="ap">Accounts Payable</TabsTrigger>
                  <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  {/* Cash Flow */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow</CardTitle>
                      <CardDescription>Incoming vs Outgoing payments over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <AreaChart 
                          data={cashFlowData}
                          index="name"
                          categories={["Incoming", "Outgoing"]}
                          colors={["#10B981", "#EF4444"]}
                          valueFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expenses By Category */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Expenses By Category</CardTitle>
                        <CardDescription>Distribution of expenses</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <PieChart 
                            data={expensesByCategory}
                            index="name"
                            category="value"
                            valueFormatter={(value) => `${value}%`}
                            colors={["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Project Profitability */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Profitability</CardTitle>
                        <CardDescription>Weekly profit margins</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <BarChart 
                            data={projectProfitability}
                            index="name"
                            categories={["profit"]}
                            colors={["#10B981"]}
                            valueFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="ap" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Accounts Payable Aging</CardTitle>
                      <CardDescription>Outstanding payments by age</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">AP detailed reports coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="ar" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Accounts Receivable Aging</CardTitle>
                      <CardDescription>Outstanding receivables by age</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">AR detailed reports coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="projects" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Financials</CardTitle>
                      <CardDescription>Financial performance by project</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Project financial reports coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

// Import the missing DropdownMenu components
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default Reports;
