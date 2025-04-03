
import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: string;
  type: 'invoice' | 'bill';
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoading(true);
        
        // Fetch recent invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, client_name, amount, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (invoicesError) throw invoicesError;
        
        // Fetch recent bills
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('id, vendor_name, amount, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (billsError) throw billsError;
        
        // Convert to transactions format
        const invoiceTransactions = (invoices || []).map(invoice => ({
          id: invoice.id,
          name: invoice.client_name,
          amount: invoice.amount,
          date: invoice.created_at,
          status: invoice.status,
          type: 'invoice' as 'invoice'
        }));
        
        const billTransactions = (bills || []).map(bill => ({
          id: bill.id,
          name: bill.vendor_name,
          amount: bill.amount,
          date: bill.created_at,
          status: bill.status,
          type: 'bill' as 'bill'
        }));
        
        // Combine and sort by date
        const allTransactions = [...invoiceTransactions, ...billTransactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  const getStatusBadge = (status: string, type: 'invoice' | 'bill') => {
    if (type === 'invoice') {
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
    } else {
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
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-construction-600 hover:text-construction-700"
          onClick={() => navigate('/accounts-receivable')}
        >
          <span>View all</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <p>Loading recent transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No recent transactions</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-construction-100 text-construction-700 text-xs">
                    {transaction.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-medium">{transaction.name}</h4>
                  <p className="text-xs text-gray-500">
                    {transaction.type === 'invoice' ? 'Invoice' : 'Bill'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">${transaction.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                </div>
                
                {getStatusBadge(transaction.status, transaction.type)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
