
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccountsReceivableHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center mb-6">
      <h1 className="text-2xl font-bold">Accounts Receivable</h1>
      <div className="ml-auto">
        <Button 
          onClick={() => navigate('/invoices/create')}
          className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Invoice</span>
        </Button>
      </div>
    </div>
  );
}
