
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type Transaction = {
  id: string;
  name: string;
  company: string;
  amount: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'invoice' | 'payment';
};

const transactions: Transaction[] = [
  {
    id: 'tr001',
    name: 'Sarah Johnson',
    company: 'Johnson Construction',
    amount: '$1,250.00',
    date: '2023-10-15',
    status: 'completed',
    type: 'payment',
  },
  {
    id: 'tr002',
    name: 'Michael Brown',
    company: 'Brown Electrical',
    amount: '$3,400.00',
    date: '2023-10-12',
    status: 'pending',
    type: 'invoice',
  },
  {
    id: 'tr003',
    name: 'Lisa Davis',
    company: 'Davis Plumbing',
    amount: '$780.00',
    date: '2023-10-10',
    status: 'completed',
    type: 'payment',
  },
  {
    id: 'tr004',
    name: 'Robert Wilson',
    company: 'Wilson Roofing',
    amount: '$5,600.00',
    date: '2023-10-08',
    status: 'failed',
    type: 'invoice',
  },
];

export function RecentTransactions() {
  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <Button variant="ghost" size="sm" className="text-construction-600 hover:text-construction-700">
          <span>View all</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-construction-100 text-construction-700 text-xs">
                  {transaction.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-medium">{transaction.name}</h4>
                <p className="text-xs text-gray-500">{transaction.company}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{transaction.amount}</p>
                <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
              
              <Badge 
                variant={
                  transaction.status === 'completed' ? 'default' : 
                  transaction.status === 'pending' ? 'outline' : 'destructive'
                }
                className={
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''
                }
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
