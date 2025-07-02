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

    // Create a simple, visible container
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 800px;
      min-height: 600px;
      background: white;
      z-index: 9999;
      padding: 20px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: black;
    `;
    
    // Add to DOM first
    document.body.appendChild(tempContainer);
    console.log('Container added to DOM');

    try {
      // Generate simple HTML content
      const htmlContent = this.createSimpleInvoiceHtml(invoice, lineItems, options);
      console.log('HTML content generated, length:', htmlContent.length);
      
      tempContainer.innerHTML = htmlContent;
      
      // Wait for DOM to update and fonts to load
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
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

  private static createSimpleInvoiceHtml(
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

    // Create a very simple HTML structure with inline styles
    return `
      <div style="width: 100%; background: white; color: black; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; margin: 0; color: black;">INVOICE</h1>
          <p style="font-size: 18px; margin: 5px 0; color: #666;">#${invoice.invoice_number}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div style="width: 48%; display: inline-block; vertical-align: top;">
            <h3 style="margin: 0 0 10px 0; color: black;">From:</h3>
            <p style="margin: 0; font-weight: bold;">${invoice.company?.name || 'Your Company'}</p>
          </div>
          <div style="width: 48%; display: inline-block; vertical-align: top; margin-left: 4%;">
            <h3 style="margin: 0 0 10px 0; color: black;">Bill To:</h3>
            <p style="margin: 0; font-weight: bold;">${invoice.client_name}</p>
            <p style="margin: 0;">${invoice.client_email}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p><strong>Invoice Date:</strong> ${formatDate(invoice.created_at)}</p>
          <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
          <p><strong>Project:</strong> ${invoice.projects?.name || 'General'}</p>
        </div>
        
        ${this.createLineItemsHtml(lineItems, options)}
        
        <div style="text-align: right; margin-top: 30px; border-top: 2px solid black; padding-top: 20px;">
          <h2 style="font-size: 28px; margin: 0; color: black;">
            Total: ${formatCurrency(Number(invoice.amount))}
          </h2>
          <p style="margin: 5px 0; color: #666;">Status: ${invoice.status}</p>
        </div>
        
        ${options.paymentTerms ? `
          <div style="margin-top: 30px;">
            <h3 style="color: black;">Payment Terms</h3>
            <p>${options.paymentTerms}</p>
          </div>
        ` : ''}
        
        ${options.notes ? `
          <div style="margin-top: 20px;">
            <h3 style="color: black;">Notes</h3>
            <p>${options.notes}</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p style="color: #999; font-size: 12px;">Thank you for your business!</p>
        </div>
      </div>
    `;
  }

  private static createLineItemsHtml(lineItems: InvoiceLineItem[], options: PdfGenerationOptions): string {
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
          <td style="border: 1px solid #ccc; padding: 8px;">${item.category_name || 'Uncategorized'}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.description || '-'}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(Number(item.cost))}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${item.markup_percentage}%</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(Number(item.price))}</td>
        </tr>
      `).join('');

      return `
        <div style="margin: 30px 0;">
          <h3 style="color: black; margin-bottom: 15px;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Category</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: right;">Cost</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: right;">Markup</th>
              <th style="border: 1px solid #ccc; padding: 10px; text-align: right;">Price</th>
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
          <h3 style="color: black; margin-bottom: 15px;">Invoice Summary</h3>
          <div style="background: #f5f5f5; padding: 20px; border: 1px solid #ccc;">
            <p><strong>Total Cost:</strong> <span style="float: right;">${formatCurrency(totalCost)}</span></p>
            <p><strong>Total Markup:</strong> <span style="float: right;">${formatCurrency(totalMarkup)}</span></p>
            <p style="border-top: 1px solid #ccc; padding-top: 10px; font-size: 18px;"><strong>Total:</strong> <span style="float: right;">${formatCurrency(totalPrice)}</span></p>
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
