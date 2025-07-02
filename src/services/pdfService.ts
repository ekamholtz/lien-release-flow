
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

    // Create container with simple, PDF-compatible styling
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      top: -10000px;
      left: 0;
      width: 210mm;
      min-height: 297mm;
      background: white;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: black;
      padding: 20mm;
      box-sizing: border-box;
    `;
    
    document.body.appendChild(tempContainer);
    console.log('Container added to DOM');

    try {
      // Generate simple HTML content
      const htmlContent = this.createSimpleInvoiceHtml(invoice, lineItems, options);
      console.log('HTML content generated, length:', htmlContent.length);
      
      tempContainer.innerHTML = htmlContent;
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

    // Very simple HTML with minimal CSS
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px; color: black;">
        <tr>
          <td style="text-align: center; padding-bottom: 30px;">
            <h1 style="font-size: 24px; margin: 0 0 10px 0; color: black;">INVOICE</h1>
            <p style="font-size: 14px; margin: 0; color: black;">#${invoice.invoice_number}</p>
          </td>
        </tr>
        
        <tr>
          <td style="padding-bottom: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="vertical-align: top; padding-right: 20px;">
                  <p style="margin: 0 0 5px 0; font-weight: bold; color: black;">From:</p>
                  <p style="margin: 0 0 5px 0; color: black;">${invoice.company?.name || 'Your Company'}</p>
                </td>
                <td width="50%" style="vertical-align: top; padding-left: 20px;">
                  <p style="margin: 0 0 5px 0; font-weight: bold; color: black;">Bill To:</p>
                  <p style="margin: 0 0 5px 0; color: black;">${invoice.client_name}</p>
                  <p style="margin: 0 0 5px 0; color: black;">${invoice.client_email}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <tr>
          <td style="padding: 15px 0; background-color: #f5f5f5;">
            <table width="100%" cellpadding="5" cellspacing="0">
              <tr>
                <td width="50%">
                  <strong>Invoice Date:</strong> ${formatDate(invoice.created_at)}
                </td>
                <td width="50%">
                  <strong>Due Date:</strong> ${formatDate(invoice.due_date)}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Project:</strong> ${invoice.projects?.name || 'General'}
                </td>
                <td>
                  <strong>Status:</strong> ${invoice.status}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        ${this.createSimpleLineItemsHtml(lineItems, options)}
        
        <tr>
          <td style="text-align: right; padding: 30px 0; border-top: 2px solid black;">
            <h2 style="font-size: 20px; margin: 0; color: black;">
              Total: ${formatCurrency(Number(invoice.amount))}
            </h2>
          </td>
        </tr>
        
        ${options.paymentTerms ? `
          <tr>
            <td style="padding: 15px 0;">
              <p style="margin: 0 0 5px 0; font-weight: bold; color: black;">Payment Terms</p>
              <p style="margin: 0; color: black;">${options.paymentTerms}</p>
            </td>
          </tr>
        ` : ''}
        
        ${options.notes ? `
          <tr>
            <td style="padding: 15px 0;">
              <p style="margin: 0 0 5px 0; font-weight: bold; color: black;">Notes</p>
              <p style="margin: 0; color: black;">${options.notes}</p>
            </td>
          </tr>
        ` : ''}
        
        <tr>
          <td style="text-align: center; padding-top: 30px; border-top: 1px solid #ccc;">
            <p style="color: #666; font-size: 11px; margin: 0;">Thank you for your business!</p>
          </td>
        </tr>
      </table>
    `;
  }

  private static createSimpleLineItemsHtml(lineItems: InvoiceLineItem[], options: PdfGenerationOptions): string {
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
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(Number(item.price))}</td>
        </tr>
      `).join('');

      return `
        <tr>
          <td style="padding: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: black;">Invoice Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Category</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">Description</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">Cost</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">Markup</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">Price</th>
              </tr>
              ${rows}
            </table>
          </td>
        </tr>
      `;
    }

    if (options.showLineItems === 'summary') {
      const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
      const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
      const totalMarkup = totalPrice - totalCost;

      return `
        <tr>
          <td style="padding: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: black;">Invoice Summary</p>
            <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f5f5f5; border: 1px solid #ccc;">
              <tr>
                <td style="font-weight: bold;">Total Cost:</td>
                <td style="text-align: right;">${formatCurrency(totalCost)}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Total Markup:</td>
                <td style="text-align: right;">${formatCurrency(totalMarkup)}</td>
              </tr>
              <tr style="border-top: 2px solid black;">
                <td style="font-weight: bold; padding-top: 10px;">Total:</td>
                <td style="text-align: right; font-weight: bold; padding-top: 10px;">${formatCurrency(totalPrice)}</td>
              </tr>
            </table>
          </td>
        </tr>
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
