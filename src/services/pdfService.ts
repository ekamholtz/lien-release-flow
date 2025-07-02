
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
    console.log('Starting PDF generation for invoice:', invoice.invoice_number);
    
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
        console.log('Fetched line items:', lineItems.length);
      }
    }

    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-10000px';
    tempContainer.style.top = '-10000px';
    tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
    tempContainer.style.height = 'auto';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '0';
    tempContainer.style.margin = '0';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.lineHeight = '1.4';
    tempContainer.style.color = '#000000';
    document.body.appendChild(tempContainer);

    try {
      // Create the invoice template HTML
      const templateHtml = this.createInvoiceTemplateHtml(invoice, lineItems, options);
      tempContainer.innerHTML = templateHtml;
      
      console.log('Template HTML created, container dimensions:', {
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight,
        innerHTML: tempContainer.innerHTML.length
      });

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate PDF
      console.log('Converting to PDF...');
      const base64Pdf = await htmlToBase64Pdf(tempContainer);
      console.log('PDF generated successfully, size:', base64Pdf.length);
      
      return base64Pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
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
        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
          <tr>
            <td colspan="5" style="padding: 0 0 15px 0;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0;">Invoice Details</h3>
            </td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: bold;">Category</td>
            <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: bold;">Description</td>
            <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: bold; text-align: right;">Cost</td>
            <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: bold; text-align: right;">Markup</td>
            <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: bold; text-align: right;">Price</td>
          </tr>
          ${lineItems.map(item => `
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 10px;">${item.category_name || 'Uncategorized'}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px;">${item.description || '-'}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: right;">${formatCurrency(Number(item.cost))}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: right;">${item.markup_percentage}%</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: right;">${formatCurrency(Number(item.price))}</td>
            </tr>
          `).join('')}
        </table>
      `;
    } else if (options.showLineItems === 'summary' && lineItems.length > 0) {
      lineItemsHtml = `
        <table style="width: 100%; margin-bottom: 30px;">
          <tr>
            <td style="padding: 0 0 15px 0;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0;">Invoice Summary</h3>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">Total Cost:</td>
                  <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;">${formatCurrency(totalCost)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">Total Markup:</td>
                  <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #dee2e6;">${formatCurrency(totalMarkup)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; font-weight: bold; font-size: 16px;">Total:</td>
                  <td style="padding: 12px 0 0 0; text-align: right; font-weight: bold; font-size: 16px;">${formatCurrency(totalPrice)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }

    return `
      <table style="width: 100%; font-family: Arial, sans-serif; color: #000000; background-color: #ffffff; border-collapse: collapse;">
        <!-- Header Section -->
        <tr>
          <td style="padding: 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  ${options.companyLogo ? `<img src="${options.companyLogo}" alt="Company Logo" style="height: 60px; margin-bottom: 15px; display: block;" />` : ''}
                  <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 5px 0;">INVOICE</h1>
                  <p style="font-size: 16px; color: #6b7280; margin: 0;">#${invoice.invoice_number}</p>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                  <h2 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">
                    ${invoice.company?.name || 'Your Company Name'}
                  </h2>
                  <p style="color: #6b7280; margin: 2px 0;">Invoice Date: ${formatDate(invoice.created_at)}</p>
                  <p style="color: #6b7280; margin: 2px 0;">Due Date: ${formatDate(invoice.due_date)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bill To Section -->
        <tr>
          <td style="padding: 0 0 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">Bill To:</h3>
                  <p style="font-weight: bold; color: #6b7280; margin: 2px 0;">${invoice.client_name}</p>
                  <p style="color: #6b7280; margin: 2px 0;">${invoice.client_email}</p>
                </td>
                <td style="width: 50%; vertical-align: top;">
                  <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">Project:</h3>
                  <p style="color: #6b7280; margin: 2px 0;">${invoice.projects?.name || 'General'}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Line Items Section -->
        ${lineItemsHtml ? `
          <tr>
            <td style="padding: 0 0 30px 0;">
              ${lineItemsHtml}
            </td>
          </tr>
        ` : ''}

        <!-- Total Amount Section -->
        <tr>
          <td style="padding: 0 0 30px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 60%;"></td>
                <td style="width: 40%; text-align: right;">
                  <div style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">
                    Total: ${formatCurrency(Number(invoice.amount))}
                  </div>
                  <div style="font-size: 12px; color: #6b7280;">
                    Status: <span style="text-transform: capitalize;">${invoice.status}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Payment Terms Section -->
        ${options.paymentTerms ? `
          <tr>
            <td style="padding: 0 0 20px 0;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">Payment Terms</h3>
              <p style="color: #6b7280; margin: 0; line-height: 1.5;">${options.paymentTerms}</p>
            </td>
          </tr>
        ` : ''}

        <!-- Notes Section -->
        ${options.notes ? `
          <tr>
            <td style="padding: 0 0 20px 0;">
              <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0;">Notes</h3>
              <p style="color: #6b7280; margin: 0; line-height: 1.5;">${options.notes}</p>
            </td>
          </tr>
        ` : ''}

        <!-- Footer Section -->
        <tr>
          <td style="padding: 20px 0 0 0; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Thank you for your business!</p>
          </td>
        </tr>
      </table>
    `;
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
