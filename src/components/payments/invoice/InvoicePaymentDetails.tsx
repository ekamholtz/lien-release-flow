
import React from 'react';
import { DbInvoice } from '@/lib/supabase';

interface InvoicePaymentDetailsProps {
  invoice: DbInvoice;
}

export function InvoicePaymentDetails({ invoice }: InvoicePaymentDetailsProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Payment Details</h3>
      <div className="bg-gray-50 p-3 rounded-md">
        <p className="text-sm">Payment Method: {invoice.payment_method === 'accelerated' ? 'Accelerated' : 'Regular'}</p>
        {invoice.payment_link && (
          <p className="text-sm">
            Payment Link: <a href={invoice.payment_link} target="_blank" className="text-blue-600 hover:underline">View</a>
          </p>
        )}
      </div>
    </div>
  );
}
