
import React from 'react';
import { DbInvoice } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceLineItem {
  id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  category_name?: string;
}

interface InvoicePdfTemplateProps {
  invoice: DbInvoice & { 
    projects?: { name: string };
    company?: { name: string };
  };
  lineItems: InvoiceLineItem[];
  showLineItems: 'none' | 'summary' | 'detailed';
  companyLogo?: string;
  paymentTerms?: string;
  notes?: string;
}

export function InvoicePdfTemplate({ 
  invoice, 
  lineItems, 
  showLineItems,
  companyLogo,
  paymentTerms = "Payment is due within 30 days of invoice date.",
  notes
}: InvoicePdfTemplateProps) {
  const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
  const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
  const totalMarkup = totalPrice - totalCost;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {companyLogo && (
            <img src={companyLogo} alt="Company Logo" className="h-16 mb-4" />
          )}
          <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
          <p className="text-lg text-gray-600">#{invoice.invoice_number}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {invoice.company?.name || 'Your Company Name'}
          </h2>
          <p className="text-gray-600">Invoice Date: {formatDate(new Date(invoice.created_at))}</p>
          <p className="text-gray-600">Due Date: {formatDate(new Date(invoice.due_date))}</p>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
          <div className="text-gray-600">
            <p className="font-medium">{invoice.client_name}</p>
            <p>{invoice.client_email}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Project:</h3>
          <p className="text-gray-600">{invoice.projects?.name || 'General'}</p>
        </div>
      </div>

      {/* Invoice Details */}
      {showLineItems === 'detailed' && lineItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Cost</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Markup</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-2">{item.category_name || 'Uncategorized'}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.description || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(Number(item.cost))}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.markup_percentage}%</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(Number(item.price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      {showLineItems === 'summary' && lineItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Summary</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between mb-2">
              <span>Total Cost:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Total Markup:</span>
              <span>{formatCurrency(totalMarkup)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div className="flex justify-end mb-8">
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-800">
            Total: {formatCurrency(Number(invoice.amount))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Status: <span className="capitalize">{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {paymentTerms && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Terms</h3>
          <p className="text-gray-600">{paymentTerms}</p>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
          <p className="text-gray-600">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm border-t pt-4">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}
