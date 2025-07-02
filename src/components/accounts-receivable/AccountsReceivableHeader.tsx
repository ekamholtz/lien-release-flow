
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BatchPdfDialog } from '@/components/payments/pdf/BatchPdfDialog';
import { DbInvoice } from '@/lib/supabase';

interface AccountsReceivableHeaderProps {
  invoices?: (DbInvoice & { 
    projects?: { name: string };
    company?: { name: string };
  })[];
}

export function AccountsReceivableHeader({ invoices = [] }: AccountsReceivableHeaderProps) {
  const navigate = useNavigate();
  const [isBatchPdfOpen, setIsBatchPdfOpen] = useState(false);

  return (
    <div className="flex items-center mb-6">
      <h1 className="text-2xl font-bold">Accounts Receivable</h1>
      <div className="ml-auto flex gap-2">
        {invoices.length > 0 && (
          <Button 
            variant="outline"
            onClick={() => setIsBatchPdfOpen(true)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            <span>Batch PDF</span>
          </Button>
        )}
        <Button 
          onClick={() => navigate('/invoices/create')}
          className="bg-construction-600 hover:bg-construction-700 flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Invoice</span>
        </Button>
      </div>

      <BatchPdfDialog
        invoices={invoices}
        isOpen={isBatchPdfOpen}
        onClose={() => setIsBatchPdfOpen(false)}
      />
    </div>
  );
}
