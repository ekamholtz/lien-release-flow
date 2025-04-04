
import React from 'react';
import { PlusCircle, FileText, Send, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center h-24 border-dashed border-2 hover:border-construction-500 hover:bg-construction-50"
        onClick={() => navigate('/create-invoice')}
      >
        <PlusCircle className="h-6 w-6 mb-2 text-construction-600" />
        <span className="text-sm">Create Invoice</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center h-24 border-dashed border-2 hover:border-construction-500 hover:bg-construction-50"
        onClick={() => navigate('/lien-release')}
      >
        <FileText className="h-6 w-6 mb-2 text-construction-600" />
        <span className="text-sm">New Lien Release</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center h-24 border-dashed border-2 hover:border-construction-500 hover:bg-construction-50"
        onClick={() => navigate('/accounts-payable')}
      >
        <Send className="h-6 w-6 mb-2 text-construction-600" />
        <span className="text-sm">Send Payment</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center h-24 border-dashed border-2 hover:border-construction-500 hover:bg-construction-50"
        onClick={() => navigate('/accounts-receivable')}
      >
        <Link className="h-6 w-6 mb-2 text-construction-600" />
        <span className="text-sm">Payment Link</span>
      </Button>
    </div>
  );
}
