
import React from 'react';
import { FinanceFilters, FinanceFiltersState } from '@/components/finance/FinanceFilters';
import { InvoicesTable } from '@/components/payments/InvoicesTable';
import { DbInvoice, InvoiceStatus } from '@/lib/supabase';

// Define an extended invoice type that includes the project name from the join
type ExtendedInvoice = DbInvoice & {
  projects?: { 
    name: string;
  };
};

interface AccountsReceivableContentProps {
  invoices: ExtendedInvoice[];
  loading: boolean;
  currentCompany: any;
  filters: FinanceFiltersState;
  onFilterChange: (newFilters: FinanceFiltersState) => void;
  onUpdateStatus: (invoiceId: string, newStatus: InvoiceStatus) => Promise<void>;
  onPayInvoice: (invoice: ExtendedInvoice) => void;
  onViewDetails: (invoice: ExtendedInvoice) => void;
}

export function AccountsReceivableContent({
  invoices,
  loading,
  currentCompany,
  filters,
  onFilterChange,
  onUpdateStatus,
  onPayInvoice,
  onViewDetails
}: AccountsReceivableContentProps) {
  return (
    <>
      <FinanceFilters 
        onFilterChange={onFilterChange}
        selectedFilters={filters}
      />
      
      <div className="dashboard-card mb-6">
        <h2 className="text-lg font-semibold mb-4">Invoices</h2>
        
        {!currentCompany ? (
          <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
            <p>Please select a company to view invoices.</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
            <p>No invoices to display. Use the "New Invoice" button to create one.</p>
          </div>
        ) : (
          <InvoicesTable 
            invoices={invoices} 
            onUpdateStatus={onUpdateStatus} 
            onPayInvoice={onPayInvoice}
            onViewDetails={onViewDetails}
          />
        )}
      </div>
    </>
  );
}
