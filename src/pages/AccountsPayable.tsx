
import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DbBill } from '@/lib/supabase';

const AccountsPayable = () => {
  const [bills, setBills] = useState<DbBill[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bills')
          .select('*, projects(name)')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        console.log('Bills data:', data);
        setBills(data || []);
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Paid</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center mb-6">
                <h1 className="text-2xl font-bold">Accounts Payable</h1>
                <div className="ml-auto flex items-center gap-2">
                  <Button 
                    onClick={() => navigate('/create-bill')}
                    className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>New Bill</span>
                  </Button>
                  <SidebarTrigger />
                </div>
              </div>
              
              <div className="dashboard-card mb-6">
                <h2 className="text-lg font-semibold mb-4">Bills</h2>
                
                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Loading bills...</p>
                  </div>
                ) : bills.length === 0 ? (
                  <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
                    <p>No bills to display. Use the "New Bill" button to add payment requests.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bill Number</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bills.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-construction-600" />
                                {bill.bill_number}
                              </div>
                            </TableCell>
                            <TableCell>{bill.vendor_name}</TableCell>
                            <TableCell>
                              {bill.project_id ? (
                                // @ts-ignore - projects is returned from the join
                                bill.projects?.name || 'Unknown Project'
                              ) : 'No Project'}
                            </TableCell>
                            <TableCell>${bill.amount.toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(bill.due_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{getStatusBadge(bill.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {bill.status === 'pending' && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Approve</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Reject</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <AiAssistant />
    </div>
  );
};

export default AccountsPayable;
