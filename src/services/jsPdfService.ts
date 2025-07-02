import jsPDF from 'jspdf';
import { Invoice, LineItem } from '@/lib/types/invoice';
import { DbInvoice } from '@/lib/supabase';

export interface PdfGenerationOptions {
  showLineItems: 'none' | 'summary' | 'detailed';
  paymentTerms?: string;
  notes?: string;
  companyLogo?: string;
}

interface CompanyProfile {
  name: string;
  street_address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface Customer {
  name: string;
  email?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
}

export class JsPdfService {
  static async generateInvoicePdf(
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    options: PdfGenerationOptions
  ): Promise<string> {
    try {
      const pdf = new jsPDF();
      
      // Set up fonts and styling
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      
      // Company header
      let yPosition = 30;
      if (options.companyLogo) {
        try {
          // Add company logo
          pdf.addImage(options.companyLogo, 'JPEG', 20, 15, 40, 20);
          yPosition = 45;
        } catch (error) {
          console.warn('Could not load company logo:', error);
        }
      }
      
      // Company name
      if (invoice.company?.name) {
        pdf.text(invoice.company.name, 20, yPosition);
      } else {
        pdf.text('Your Company', 20, yPosition);
      }
      
      yPosition += 20;

      // Invoice details
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', 150, 30);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice #: ${invoice.invoice_number}`, 150, 40);
      pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 150, 48);
      pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 56);

      // Customer details
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', 20, yPosition);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(invoice.client_name, 20, yPosition + 8);
      pdf.text(invoice.client_email, 20, yPosition + 16);

      yPosition += 40;

      // Project details
      if (invoice.projects?.name) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Project:', 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(invoice.projects.name, 20, yPosition + 8);
        yPosition += 20;
      }

      // Line items based on options
      if (options.showLineItems !== 'none') {
        yPosition += 10;
        
        if (options.showLineItems === 'summary') {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Invoice Summary', 20, yPosition);
          yPosition += 15;
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Total Amount: $${Number(invoice.amount).toFixed(2)}`, 20, yPosition);
          yPosition += 10;
        }
      }

      // Total amount
      yPosition += 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total: $${Number(invoice.amount).toFixed(2)}`, 150, yPosition);

      // Payment terms
      if (options.paymentTerms) {
        yPosition += 30;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment Terms:', 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        const terms = pdf.splitTextToSize(options.paymentTerms, 170);
        pdf.text(terms, 20, yPosition + 8);
        yPosition += 8 + (terms.length * 5);
      }

      // Notes
      if (options.notes) {
        yPosition += 20;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        const notes = pdf.splitTextToSize(options.notes, 170);
        pdf.text(notes, 20, yPosition + 8);
      }

      return pdf.output('datauristring').split(',')[1]; // Return base64 string without data URL prefix
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
