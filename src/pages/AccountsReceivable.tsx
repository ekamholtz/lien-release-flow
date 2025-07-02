
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PayInvoice } from '@/components/payments/PayInvoice';
import { InvoiceDetailsModal } from '@/components/payments/InvoiceDetailsModal';
import { AccountsReceivableHeader } from '@/components/accounts-receivable/AccountsReceivableHeader';
import { AccountsReceivableContent } from '@/components/accounts-receivable/AccountsReceivableContent';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';

const AccountsReceivable = () => {
  const {
    invoices,
    loading,
    selectedInvoice,
    isPaymentDialogOpen,
    isDetailsModalOpen,
    filters,
    currentCompany,
    handleUpdateStatus,
    handlePayInvoice,
    handleViewDetails,
    handleFilterChange,
    handlePaymentDialogClose,
    handleDetailsModalClose,
    handlePaymentComplete
  } = useAccountsReceivable();

  console.log('AccountsReceivable - selectedInvoice:', selectedInvoice);
  console.log('AccountsReceivable - isDetailsModalOpen:', isDetailsModalOpen);

  return (
    <AppLayout>
      <div className="w-full p-6">
        <AccountsReceivableHeader invoices={invoices} />
        
        <AccountsReceivableContent
          invoices={invoices}
          loading={loading}
          currentCompany={currentCompany}
          filters={filters}
          onFilterChange={handleFilterChange}
          onUpdateStatus={handleUpdateStatus}
          onPayInvoice={handlePayInvoice}
          onViewDetails={handleViewDetails}
        />
      </div>
      
      {selectedInvoice && (
        <>
          <PayInvoice
            invoice={selectedInvoice}
            isOpen={isPaymentDialogOpen}
            onClose={handlePaymentDialogClose}
            onPaymentComplete={handlePaymentComplete}
          />
          
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            isOpen={isDetailsModalOpen}
            onClose={handleDetailsModalClose}
          />
        </>
      )}
    </AppLayout>
  );
};

export default AccountsReceivable;
