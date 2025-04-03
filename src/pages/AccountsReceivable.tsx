import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { AiAssistant } from '@/components/dashboard/AiAssistant';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Send, Eye, CreditCard, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { PayInvoice } from '@/components/payments/PayInvoice';

// Define an extended invoice type that includes the project name from the join
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
};

const AccountsReceivable = () => {
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Invoices data:', data);
      setInvoices(data as ExtendedInvoice[] || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sent</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);
        
      if (error) throw error;
      
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus } 
          : invoice
      ));
      
      toast({
        title: `Invoice ${newStatus === 'sent' ? 'sent' : 'updated'}`,
        description: newStatus === 'sent' 
          ? `The invoice has been sent to the client`
          : `The invoice status has been updated`,
      });
    } catch (error) {
      console.error(`Error updating invoice status to ${newStatus}:`, error);
      toast({
        title: "Error",
        description: `Failed to update invoice status`,
        variant: "destructive"
      });
    }
  };
  
  const handlePayInvoice = (invoice: ExtendedInvoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Accounts Receivable</h1>
          <div className="ml-auto">
            <Button 
              onClick={() => navigate('/create-invoice')}
              className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Invoice</span>
            </Button>
          </div>
        </div>
        
        <div className="dashboard-card mb-6">
          <h2 className="text-lg font-semibold mb-4">Invoices</h2>
          
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
              <p>No invoices to display. Use the "New Invoice" button to create an invoice.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-construction-600" />
                          {invoice.invoice_number}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.client_name}</TableCell>
                      <TableCell>
                        {invoice.project_id ? (
                          // @ts-ignore - projects is returned from the join
                          invoice.projects?.name || 'Unknown Project'
                        ) : 'No Project'}
                      </TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
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
                          
                          {invoice.status === 'draft' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-600"
                                    onClick={() => handleUpdateStatus(invoice.id, 'sent')}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send Invoice</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-green-600"
                                    onClick={() => handlePayInvoice(invoice)}
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Record Payment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {invoice.status === 'paid' && invoice.payment_link && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-600"
                                    onClick={() => window.open(invoice.payment_link, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Payment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
      
      {selectedInvoice && (
        <PayInvoice
          invoice={selectedInvoice}
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          onPaymentComplete={() => {
            fetchInvoices();
            setSelectedInvoice(null);
          }}
        />
      )}
      
      <AiAssistant />
    </AppLayout>
  );
};

export default AccountsReceivable;
