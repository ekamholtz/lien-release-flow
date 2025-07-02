
import React from 'react';
import { format } from 'date-fns';
import { DbInvoice } from '@/lib/supabase';

interface InvoiceTimelineProps {
  invoice: DbInvoice;
}

export function InvoiceTimeline({ invoice }: InvoiceTimelineProps) {
  return (
    <div>
      <h3 className="font-medium mb-1">Timeline</h3>
      <div className="space-y-3">
        <div className="flex items-start">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
          <div>
            <p className="text-sm font-medium">Created</p>
            <p className="text-xs text-gray-500">{format(new Date(invoice.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
        
        {invoice.status !== 'draft' && (
          <div className="flex items-start">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></div>
            <div>
              <p className="text-sm font-medium">Sent to Client</p>
              <p className="text-xs text-gray-500">After {format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        )}
        
        {invoice.status === 'paid' && (
          <div className="flex items-start">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 mr-2"></div>
            <div>
              <p className="text-sm font-medium">Paid</p>
              <p className="text-xs text-gray-500">Payment received</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
