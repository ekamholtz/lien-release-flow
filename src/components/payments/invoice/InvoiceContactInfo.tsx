
import React from 'react';
import { DbInvoice } from '@/lib/supabase';

interface InvoiceContactInfoProps {
  invoice: DbInvoice;
}

export function InvoiceContactInfo({ invoice }: InvoiceContactInfoProps) {
  if (!invoice.client_email) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Contact Information</h3>
      <div className="bg-gray-50 p-3 rounded-md">
        <p className="text-sm">Email: {invoice.client_email}</p>
      </div>
    </div>
  );
}
