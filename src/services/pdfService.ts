
import { htmlToBase64Pdf } from '@/utils/htmlToBase64Pdf';
import { DbInvoice } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';

export interface PdfGenerationOptions {
  showLineItems: 'none' | 'summary' | 'detailed';
  companyLogo?: string;
  paymentTerms?: string;
  notes?: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  category_name?: string;
}

export class PdfService {
  static async generateInvoicePdf(
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    options: PdfGenerationOptions
  ): Promise<string> {
    // Fetch line items if needed
    let lineItems: InvoiceLineItem[] = [];
    
    if (options.showLineItems !== 'none' && invoice.has_line_items) {
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select(`
          *,
          expense_categories (name)
        `)
        .eq('invoice_id', invoice.id);
      
      if (!error && data) {
        lineItems = data.map((item: any) => ({
          ...item,
          category_name: item.expense_categories?.name || 'Uncategorized'
        }));
      }
    }

    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    document.body.appendChild(tempContainer);

    try {
      // Create the invoice template HTML
      const templateHtml = this.createInvoiceTemplateHtml(invoice, lineItems, options);
      tempContainer.innerHTML = templateHtml;

      // Generate PDF
      const base64Pdf = await htmlToBase64Pdf(tempContainer);
      
      return base64Pdf;
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  }

  private static createInvoiceTemplateHtml(
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    lineItems: InvoiceLineItem[],
    options: PdfGenerationOptions
  ): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US').format(date);
    };

    const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
    const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
    const totalMarkup = totalPrice - totalCost;

    let lineItemsHtml = '';
    
    if (options.showLineItems === 'detailed' && lineItems.length > 0) {
      lineItemsHtml = `
        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: left;">Category</th>
                <th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: left;">Description</th>
                <th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: right;">Cost</th>
                <th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: right;">Markup</th>
                <th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems.map(item => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px 16px;">${item.category_name || 'Uncategorized'}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px 16px;">${item.description || '-'}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: right;">${formatCurrency(Number(item.cost))}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: right;">${item.markup_percentage}%</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: right;">${formatCurrency(Number(item.price))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (options.showLineItems === 'summary' && lineItems.length > 0) {
      lineItemsHtml = `
        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Invoice Summary</h3>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Total Cost:</span>
              <span>${formatCurrency(totalCost)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Total Markup:</span>
              <span>${formatCurrency(totalMarkup)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid #d1d5db; padding-top: 8px;">
              <span>Total:</span>
              <span>${formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div style="background: white; padding: 32px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
          <div>
            ${options.companyLogo ? `<img src="${options.companyLogo}" alt="Company Logo" style="height: 64px; margin-bottom: 16px;" />` : ''}
            <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0;">INVOICE</h1>
            <p style="font-size: 18px; color: #6b7280; margin: 4px 0;">#${invoice.invoice_number}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">
              ${invoice.company?.name || 'Your Company Name'}
            </h2>
            <p style="color: #6b7280; margin: 2px 0;">Invoice Date: ${formatDate(invoice.created_at)}</p>
            <p style="color: #6b7280; margin: 2px 0;">Due Date: ${formatDate(invoice.due_date)}</p>
          </div>
        </div>

        <!-- Bill To Section -->
        <div style="display: flex; margin-bottom: 32px;">
          <div style="flex: 1; margin-right: 32px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Bill To:</h3>
            <div style="color: #6b7280;">
              <p style="font-weight: 500; margin: 2px 0;">${invoice.client_name}</p>
              <p style="margin: 2px 0;">${invoice.client_email}</p>
            </div>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Project:</h3>
            <p style="color: #6b7280; margin: 2px 0;">${invoice.projects?.name || 'General'}</p>
          </div>
        </div>

        <!-- Line Items -->
        ${lineItemsHtml}

        <!-- Total Amount -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: bold; color: #1f2937;">
              Total: ${formatCurrency(Number(invoice.amount))}
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
              Status: <span style="text-transform: capitalize;">${invoice.status}</span>
            </div>
          </div>
        </div>

        <!-- Payment Terms -->
        ${options.paymentTerms ? `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Payment Terms</h3>
            <p style="color: #6b7280; margin: 0;">${options.paymentTerms}</p>
          </div>
        ` : ''}

        <!-- Notes -->
        ${options.notes ? `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Notes</h3>
            <p style="color: #6b7280; margin: 0;">${options.notes}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <p style="margin: 0;">Thank you for your business!</p>
        </div>
      </div>
    `;
  }

  static downloadPdf(base64Pdf: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64Pdf}`;
    link.download = fileName;
    link.click();
  }

  static async generateBatchPdfs(
    invoices: (DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    })[],
    options: PdfGenerationOptions
  ): Promise<{ invoice: DbInvoice; pdf: string }[]> {
    const results = [];
    
    for (const invoice of invoices) {
      try {
        const pdf = await this.generateInvoicePdf(invoice, options);
        results.push({ invoice, pdf });
      } catch (error) {
        console.error(`Failed to generate PDF for invoice ${invoice.invoice_number}:`, error);
      }
    }
    
    return results;
  }
}
