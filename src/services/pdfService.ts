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
    console.log('=== PDF Generation Started ===');
    console.log('Invoice:', invoice.invoice_number);
    console.log('Options:', options);
    
    // Fetch line items if needed
    let lineItems: InvoiceLineItem[] = [];
    
    if (options.showLineItems !== 'none' && invoice.has_line_items) {
      console.log('Fetching line items...');
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
        console.log('Line items fetched:', lineItems.length);
      } else {
        console.log('No line items or error:', error);
      }
    }

    // Create a properly sized container for PDF generation
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: 0;
      width: 595px;
      min-height: 842px;
      background: white;
      padding: 40px;
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      box-sizing: border-box;
      overflow: visible;
    `;
    
    // Add to DOM first
    document.body.appendChild(tempContainer);
    console.log('Container added to DOM');

    try {
      // Generate improved HTML content with proper A4 sizing
      const htmlContent = this.createA4OptimizedInvoiceHtml(invoice, lineItems, options);
      console.log('HTML content generated, length:', htmlContent.length);
      
      tempContainer.innerHTML = htmlContent;
      
      // Wait for DOM to update and fonts to load
      await new Promise(resolve => {
        setTimeout(resolve, 500);
      });
      
      console.log('Container after content added:');
      console.log('- Width:', tempContainer.offsetWidth);
      console.log('- Height:', tempContainer.offsetHeight);
      console.log('- Has content:', tempContainer.innerHTML.length > 0);

      // Generate PDF
      console.log('Starting PDF conversion...');
      const base64Pdf = await htmlToBase64Pdf(tempContainer);
      console.log('PDF generated successfully, size:', base64Pdf.length);
      
      return base64Pdf;
    } catch (error) {
      console.error('Error in PDF generation:', error);
      throw error;
    } finally {
      // Clean up
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
        console.log('Container cleaned up');
      }
    }
  }

  private static createA4OptimizedInvoiceHtml(
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

    // Optimized HTML for A4 PDF generation
    return `
      <div style="width: 100%; max-width: 515px; margin: 0; padding: 0; background: white; color: #000; font-family: Arial, sans-serif;">
        
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #000;">
          ${options.companyLogo ? `<div style="margin-bottom: 15px;"><img src="${options.companyLogo}" alt="Company Logo" style="max-height: 60px; max-width: 200px;" /></div>` : ''}
          <h1 style="font-size: 28px; margin: 10px 0 5px 0; color: #000; font-weight: bold;">INVOICE</h1>
          <p style="font-size: 16px; margin: 0; color: #666;">#${invoice.invoice_number}</p>
        </div>
        
        <!-- Company and Bill To Section -->
        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
              <h3 style="margin: 0 0 10px 0; color: #000; font-size: 14px; font-weight: bold;">From:</h3>
              <div style="font-size: 12px;">
                <div style="margin-bottom: 5px; font-weight: bold;">${invoice.company?.name || 'Your Company'}</div>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px;">
              <h3 style="margin: 0 0 10px 0; color: #000; font-size: 14px; font-weight: bold;">Bill To:</h3>
              <div style="font-size: 12px;">
                <div style="margin-bottom: 5px; font-weight: bold;">${invoice.client_name}</div>
                <div style="margin-bottom: 5px;">${invoice.client_email}</div>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Invoice Details Section -->
        <div style="margin-bottom: 30px; background: #f8f8f8; padding: 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; font-size: 12px; padding: 3px 0;">
                <strong>Invoice Date:</strong> ${formatDate(invoice.created_at)}
              </td>
              <td style="width: 50%; font-size: 12px; padding: 3px 0;">
                <strong>Due Date:</strong> ${formatDate(invoice.due_date)}
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; padding: 3px 0;">
                <strong>Project:</strong> ${invoice.projects?.name || 'General'}
              </td>
              <td style="font-size: 12px; padding: 3px 0;">
                <strong>Status:</strong> <span style="text-transform: capitalize;">${invoice.status}</span>
              </td>
            </tr>
          </table>
        </div>
        
        ${this.createA4LineItemsHtml(lineItems, options)}
        
        <!-- Total Section -->
        <div style="text-align: right; margin: 30px 0; padding: 20px 0; border-top: 2px solid #000;">
          <h2 style="font-size: 24px; margin: 0; color: #000; font-weight: bold;">
            Total: ${formatCurrency(Number(invoice.amount))}
          </h2>
        </div>
        
        ${options.paymentTerms ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #000; font-size: 14px; margin-bottom: 8px; font-weight: bold;">Payment Terms</h3>
            <p style="font-size: 12px; line-height: 1.4; color: #333; margin: 0;">${options.paymentTerms}</p>
          </div>
        ` : ''}
        
        ${options.notes ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #000; font-size: 14px; margin-bottom: 8px; font-weight: bold;">Notes</h3>
            <p style="font-size: 12px; line-height: 1.4; color: #333; margin: 0;">${options.notes}</p>
          </div>
        ` : ''}
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p style="color: #999; font-size: 11px; margin: 0;">Thank you for your business!</p>
        </div>
      </div>
    `;
  }

  private static createA4LineItemsHtml(lineItems: InvoiceLineItem[], options: PdfGenerationOptions): string {
    if (options.showLineItems === 'none' || lineItems.length === 0) {
      return '';
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    if (options.showLineItems === 'detailed') {
      const rows = lineItems.map(item => `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px; font-size: 11px;">${item.category_name || 'Uncategorized'}</td>
          <td style="border: 1px solid #ccc; padding: 8px; font-size: 11px;">${item.description || '-'}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 11px;">${formatCurrency(Number(item.cost))}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 11px;">${item.markup_percentage}%</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 11px; font-weight: bold;">${formatCurrency(Number(item.price))}</td>
        </tr>
      `).join('');

      return `
        <div style="margin: 30px 0;">
          <h3 style="color: #000; margin-bottom: 15px; font-size: 16px; font-weight: bold;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; font-weight: bold;">Category</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; font-weight: bold;">Description</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 12px; font-weight: bold;">Cost</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 12px; font-weight: bold;">Markup</th>
              <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 12px; font-weight: bold;">Price</th>
            </tr>
            ${rows}
          </table>
        </div>
      `;
    }

    if (options.showLineItems === 'summary') {
      const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
      const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
      const totalMarkup = totalPrice - totalCost;

      return `
        <div style="margin: 30px 0;">
          <h3 style="color: #000; margin-bottom: 15px; font-size: 16px; font-weight: bold;">Invoice Summary</h3>
          <div style="background: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 14px; padding: 5px 0; border-bottom: 1px solid #ddd;">
                  <strong>Total Cost:</strong>
                </td>
                <td style="font-size: 14px; padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">
                  ${formatCurrency(totalCost)}
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; padding: 5px 0; border-bottom: 1px solid #ddd;">
                  <strong>Total Markup:</strong>
                </td>
                <td style="font-size: 14px; padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">
                  ${formatCurrency(totalMarkup)}
                </td>
              </tr>
              <tr>
                <td style="font-size: 16px; padding: 10px 0; border-top: 2px solid #000;">
                  <strong>Total:</strong>
                </td>
                <td style="font-size: 16px; padding: 10px 0; text-align: right; font-weight: bold; border-top: 2px solid #000;">
                  ${formatCurrency(totalPrice)}
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;
    }

    return '';
  }

  static downloadPdf(base64Pdf: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64Pdf}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        console.log(`Generating PDF for invoice ${invoice.invoice_number}...`);
        const pdf = await this.generateInvoicePdf(invoice, options);
        results.push({ invoice, pdf });
      } catch (error) {
        console.error(`Failed to generate PDF for invoice ${invoice.invoice_number}:`, error);
      }
    }
    
    return results;
  }
}
