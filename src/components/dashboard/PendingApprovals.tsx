
import React from 'react';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ApprovalItem = {
  id: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
};

const approvalItems: ApprovalItem[] = [
  {
    id: 'app001',
    title: 'Foundation Concrete Payment',
    description: 'Final payment for foundation work',
    amount: '$4,850.00',
    dueDate: '2023-10-25',
  },
  {
    id: 'app002',
    title: 'Electrical Installation (Phase 1)',
    description: 'First floor electrical installation',
    amount: '$2,350.00',
    dueDate: '2023-10-28',
  },
  {
    id: 'app003',
    title: 'Plumbing Fixtures',
    description: 'Bathroom and kitchen fixtures',
    amount: '$1,780.00',
    dueDate: '2023-11-02',
  },
];

export function PendingApprovals() {
  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pending Approvals</h3>
      </div>
      
      <div className="space-y-4">
        {approvalItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-construction-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-construction-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{item.amount}</p>
                <p className="text-xs text-gray-500">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <XCircle className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
