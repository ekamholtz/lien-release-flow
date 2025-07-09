import jsPDF from 'jspdf';
import { DbInvoice } from '@/lib/supabase';

export interface PdfGenerationOptions {
  showLineItems: 'none' | 'summary' | 'detailed';
  paymentTerms?: string;
  notes?: string;
  companyLogo?: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  category_name?: string;
}

export class JsPdfService {
  private static addHeader(
    pdf: jsPDF, 
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    options: PdfGenerationOptions
  ): number {
    // Company logo and header section
    let yPos = 20;
    
    if (options.companyLogo) {
      try {
        pdf.addImage(options.companyLogo, 'JPEG', 20, yPos, 50, 25);
        yPos += 30;
      } catch (error) {
        console.warn('Could not load company logo:', error);
      }
    }

    // Company name
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text(invoice.company?.name || 'Your Company', 20, yPos);
    
    // Invoice title and number (right side)
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(52, 152, 219);
    pdf.text('INVOICE', 140, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`#${invoice.invoice_number}`, 140, yPos + 8);

    return yPos + 25;
  }

  private static addInvoiceDetails(
    pdf: jsPDF,
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    yPos: number
  ): number {
    // Invoice details box
    pdf.setFillColor(248, 249, 250);
    pdf.rect(140, yPos, 50, 35, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(52, 73, 94);
    
    pdf.text('Invoice Date:', 145, yPos + 8);
    pdf.text('Due Date:', 145, yPos + 16);
    pdf.text('Status:', 145, yPos + 24);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(invoice.created_at).toLocaleDateString(), 145, yPos + 12);
    pdf.text(new Date(invoice.due_date).toLocaleDateString(), 145, yPos + 20);
    
    // Status with color
    const statusColor = invoice.status === 'paid' ? [39, 174, 96] : 
                       invoice.status === 'overdue' ? [231, 76, 60] : [241, 196, 15];
    pdf.setTextColor(...statusColor);
    pdf.text(invoice.status.toUpperCase(), 145, yPos + 28);
    
    pdf.setTextColor(0, 0, 0);
    return yPos + 45;
  }

  private static addBillToSection(
    pdf: jsPDF,
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    yPos: number
  ): number {
    // Bill To section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(52, 73, 94);
    pdf.text('BILL TO:', 20, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(invoice.client_name, 20, yPos + 10);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(invoice.client_email, 20, yPos + 18);
    
    // Project information (right side)
    if (invoice.projects?.name) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 73, 94);
      pdf.text('PROJECT:', 140, yPos);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(invoice.projects.name, 140, yPos + 10);
    }

    return yPos + 35;
  }

  private static addLineItemsTable(
    pdf: jsPDF,
    lineItems: InvoiceLineItem[],
    yPos: number,
    showLineItems: 'summary' | 'detailed'
  ): number {
    if (!lineItems.length) return yPos;

    // Table header
    pdf.setFillColor(52, 73, 94);
    pdf.rect(20, yPos, 170, 10, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    
    if (showLineItems === 'detailed') {
      pdf.text('DESCRIPTION', 25, yPos + 7);
      pdf.text('CATEGORY', 90, yPos + 7);
      pdf.text('COST', 125, yPos + 7);
      pdf.text('MARKUP', 145, yPos + 7);
      pdf.text('AMOUNT', 170, yPos + 7);
    } else {
      pdf.text('DESCRIPTION', 25, yPos + 7);
      pdf.text('AMOUNT', 170, yPos + 7);
    }
    
    yPos += 10;
    
    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    
    let totalCost = 0;
    let totalPrice = 0;
    
    lineItems.forEach((item, index) => {
      totalCost += Number(item.cost);
      totalPrice += Number(item.price);
      
      // Alternate row colors
      if (index % 2 === 1) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, yPos, 170, 8, 'F');
      }
      
      if (showLineItems === 'detailed') {
        const description = pdf.splitTextToSize(item.description || 'No description', 60);
        pdf.text(description[0] || '', 25, yPos + 6);
        pdf.text(item.category_name || 'Uncategorized', 90, yPos + 6);
        pdf.text(`$${Number(item.cost).toFixed(2)}`, 125, yPos + 6);
        pdf.text(`${item.markup_percentage}%`, 145, yPos + 6);
        pdf.text(`$${Number(item.price).toFixed(2)}`, 170, yPos + 6);
      } else {
        const description = pdf.splitTextToSize(item.description || 'Service', 120);
        pdf.text(description[0] || '', 25, yPos + 6);
        pdf.text(`$${Number(item.price).toFixed(2)}`, 170, yPos + 6);
      }
      
      yPos += 8;
    });
    
    // Summary section
    if (showLineItems === 'summary') {
      yPos += 5;
      pdf.setFillColor(248, 249, 250);
      pdf.rect(120, yPos, 70, 25, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal (Cost):', 125, yPos + 8);
      pdf.text(`$${totalCost.toFixed(2)}`, 170, yPos + 8);
      
      pdf.text('Markup:', 125, yPos + 16);
      pdf.text(`$${(totalPrice - totalCost).toFixed(2)}`, 170, yPos + 16);
      
      yPos += 25;
    }

    return yPos + 10;
  }

  private static addTotalSection(
    pdf: jsPDF,
    invoice: DbInvoice,
    yPos: number
  ): number {
    // Total amount box
    pdf.setFillColor(52, 73, 94);
    pdf.rect(120, yPos, 70, 15, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('TOTAL:', 125, yPos + 10);
    pdf.text(`$${Number(invoice.amount).toFixed(2)}`, 160, yPos + 10);
    
    pdf.setTextColor(0, 0, 0);
    return yPos + 25;
  }

  private static addFooterSections(
    pdf: jsPDF,
    options: PdfGenerationOptions,
    yPos: number
  ): number {
    // Payment terms
    if (options.paymentTerms) {
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 73, 94);
      pdf.text('PAYMENT TERMS', 20, yPos);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const terms = pdf.splitTextToSize(options.paymentTerms, 170);
      terms.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPos + 8 + (index * 5));
      });
      
      yPos += 8 + (terms.length * 5) + 10;
    }
    
    // Notes
    if (options.notes) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 73, 94);
      pdf.text('NOTES', 20, yPos);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const notes = pdf.splitTextToSize(options.notes, 170);
      notes.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPos + 8 + (index * 5));
      });
      
      yPos += 8 + (notes.length * 5) + 15;
    }
    
    // Footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text('Thank you for your business!', 105, yPos, { align: 'center' });
    
    return yPos;
  }

  static async generateInvoicePdf(
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    options: PdfGenerationOptions,
    lineItems: InvoiceLineItem[] = []
  ): Promise<string> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add sections in order
      let yPos = this.addHeader(pdf, invoice, options);
      yPos = this.addInvoiceDetails(pdf, invoice, yPos);
      yPos = this.addBillToSection(pdf, invoice, yPos);
      
      // Add line items if requested and available
      if (options.showLineItems !== 'none' && lineItems.length > 0) {
        yPos = this.addLineItemsTable(pdf, lineItems, yPos, options.showLineItems);
      }
      
      yPos = this.addTotalSection(pdf, invoice, yPos);
      this.addFooterSections(pdf, options, yPos);

      return pdf.output('datauristring').split(',')[1];
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  static async generateBatchPdfs(
    invoices: (DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    })[],
    options: PdfGenerationOptions
  ): Promise<Array<{ invoice: DbInvoice, pdf: string }>> {
    const results = [];
    
    for (const invoice of invoices) {
      try {
        const pdf = await this.generateInvoicePdf(invoice, options);
        results.push({ invoice, pdf });
      } catch (error) {
        console.error(`Error generating PDF for invoice ${invoice.invoice_number}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  static downloadPdf(pdfBase64: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Keep the original function for backward compatibility
export const generateInvoicePDF = JsPdfService.generateInvoicePdf;
