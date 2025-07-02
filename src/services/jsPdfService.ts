
import jsPDF from 'jspdf';
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

interface CompanyProfile {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

export class JsPdfService {
  static async loadImageAsBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  }

  static async generateInvoicePdf(
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    options: PdfGenerationOptions
  ): Promise<string> {
    console.log('=== jsPDF Generation Started ===');
    console.log('Invoice:', invoice.invoice_number);
    console.log('Options:', options);
    
    // Fetch company profile data
    let companyProfile: CompanyProfile = {
      name: invoice.company?.name || 'Your Company'
    };
    
    if (invoice.company_id) {
      console.log('Fetching company profile...');
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name, address, phone, email, logo_url')
        .eq('id', invoice.company_id)
        .single();
      
      if (!companyError && companyData) {
        companyProfile = companyData;
        console.log('Company profile loaded:', companyProfile.name);
      }
    }
    
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

    try {
      // Create new jsPDF document
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Load company logo if available
      let logoImage: string | null = null;
      const logoUrl = options.companyLogo || companyProfile.logo_url;
      if (logoUrl) {
        console.log('Loading company logo...');
        logoImage = await this.loadImageAsBase64(logoUrl);
        if (logoImage) {
          console.log('Logo loaded successfully');
        }
      }
      
      // Helper functions
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

      const addText = (text: string, x: number, y: number, options?: { fontSize?: number, fontStyle?: string, align?: 'left' | 'center' | 'right' }) => {
        if (options?.fontSize) doc.setFontSize(options.fontSize);
        if (options?.fontStyle) doc.setFont('helvetica', options.fontStyle as any);
        
        if (options?.align === 'right') {
          doc.text(text, x, y, { align: 'right' });
        } else if (options?.align === 'center') {
          doc.text(text, x, y, { align: 'center' });
        } else {
          doc.text(text, x, y);
        }
        
        // Reset to default
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
      };

      // Company Logo and Header
      if (logoImage) {
        try {
          doc.addImage(logoImage, 'JPEG', 20, yPosition, 40, 30);
          yPosition += 35;
        } catch (logoError) {
          console.error('Error adding logo to PDF:', logoError);
          yPosition += 5; // Small spacing if logo fails
        }
      }

      // Invoice Title
      addText('INVOICE', 105, yPosition, { fontSize: 24, fontStyle: 'bold', align: 'center' });
      yPosition += 10;
      addText(`#${invoice.invoice_number}`, 105, yPosition, { fontSize: 14, align: 'center' });
      yPosition += 20;

      // Company Information
      addText('From:', 20, yPosition, { fontStyle: 'bold' });
      addText('Bill To:', 120, yPosition, { fontStyle: 'bold' });
      yPosition += 8;
      
      // Company details (left side)
      addText(companyProfile.name, 20, yPosition, { fontStyle: 'bold' });
      yPosition += 6;
      
      if (companyProfile.address) {
        addText(companyProfile.address, 20, yPosition);
        yPosition += 6;
      }
      
      let clientYPosition = yPosition - (companyProfile.address ? 12 : 6);
      
      // Client details (right side)
      addText(invoice.client_name, 120, clientYPosition);
      clientYPosition += 6;
      addText(invoice.client_email, 120, clientYPosition);
      clientYPosition += 6;
      
      // Add company contact info if available
      if (companyProfile.phone || companyProfile.email) {
        let contactInfo = [];
        if (companyProfile.phone) contactInfo.push(`Phone: ${companyProfile.phone}`);
        if (companyProfile.email) contactInfo.push(`Email: ${companyProfile.email}`);
        
        contactInfo.forEach(info => {
          addText(info, 20, yPosition, { fontSize: 10 });
          yPosition += 5;
        });
      }
      
      yPosition = Math.max(yPosition, clientYPosition) + 10;

      // Invoice Information Box
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPosition, 170, 25, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPosition, 170, 25);
      
      yPosition += 8;
      addText(`Invoice Date: ${formatDate(invoice.created_at)}`, 25, yPosition, { fontStyle: 'bold' });
      addText(`Due Date: ${formatDate(invoice.due_date)}`, 120, yPosition, { fontStyle: 'bold' });
      yPosition += 8;
      
      addText(`Project: ${invoice.projects?.name || 'General'}`, 25, yPosition, { fontStyle: 'bold' });
      addText(`Status: ${invoice.status}`, 120, yPosition, { fontStyle: 'bold' });
      yPosition += 15;

      // Line Items
      if (options.showLineItems === 'detailed' && lineItems.length > 0) {
        addText('Invoice Details', 20, yPosition, { fontSize: 14, fontStyle: 'bold' });
        yPosition += 10;
        
        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition - 5, 170, 8, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPosition - 5, 170, 8);
        
        addText('Category', 25, yPosition, { fontStyle: 'bold', fontSize: 10 });
        addText('Description', 70, yPosition, { fontStyle: 'bold', fontSize: 10 });
        addText('Cost', 120, yPosition, { fontStyle: 'bold', fontSize: 10 });
        addText('Markup', 140, yPosition, { fontStyle: 'bold', fontSize: 10 });
        addText('Price', 165, yPosition, { fontStyle: 'bold', fontSize: 10 });
        yPosition += 8;
        
        // Table rows
        lineItems.forEach((item) => {
          doc.setDrawColor(230, 230, 230);
          doc.line(20, yPosition + 2, 190, yPosition + 2);
          
          addText(item.category_name || 'Uncategorized', 25, yPosition, { fontSize: 9 });
          addText(item.description || '-', 70, yPosition, { fontSize: 9 });
          addText(formatCurrency(Number(item.cost)), 135, yPosition, { fontSize: 9, align: 'right' });
          addText(`${item.markup_percentage}%`, 155, yPosition, { fontSize: 9, align: 'right' });
          addText(formatCurrency(Number(item.price)), 185, yPosition, { fontSize: 9, align: 'right' });
          yPosition += 8;
        });
        
        yPosition += 10;
      } else if (options.showLineItems === 'summary' && lineItems.length > 0) {
        const totalCost = lineItems.reduce((sum, item) => sum + Number(item.cost), 0);
        const totalPrice = lineItems.reduce((sum, item) => sum + Number(item.price), 0);
        const totalMarkup = totalPrice - totalCost;
        
        addText('Invoice Summary', 20, yPosition, { fontSize: 14, fontStyle: 'bold' });
        yPosition += 10;
        
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 5, 170, 25, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, yPosition - 5, 170, 25);
        
        yPosition += 3;
        addText('Total Cost:', 25, yPosition, { fontStyle: 'bold' });
        addText(formatCurrency(totalCost), 185, yPosition, { align: 'right' });
        yPosition += 8;
        
        addText('Total Markup:', 25, yPosition, { fontStyle: 'bold' });
        addText(formatCurrency(totalMarkup), 185, yPosition, { align: 'right' });
        yPosition += 8;
        
        // Total line
        doc.setDrawColor(31, 41, 55);
        doc.setLineWidth(2);
        doc.line(25, yPosition, 185, yPosition);
        yPosition += 5;
        
        addText('Total:', 25, yPosition, { fontStyle: 'bold' });
        addText(formatCurrency(totalPrice), 185, yPosition, { fontStyle: 'bold', align: 'right' });
        yPosition += 15;
      }

      // Total Amount (always shown)
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(2);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      addText(`Total: ${formatCurrency(Number(invoice.amount))}`, 190, yPosition, { 
        fontSize: 20, 
        fontStyle: 'bold', 
        align: 'right' 
      });
      yPosition += 20;

      // Payment Terms
      if (options.paymentTerms) {
        addText('Payment Terms', 20, yPosition, { fontSize: 14, fontStyle: 'bold' });
        yPosition += 8;
        
        const lines = doc.splitTextToSize(options.paymentTerms, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 6 + 10;
      }

      // Notes
      if (options.notes) {
        addText('Notes', 20, yPosition, { fontSize: 14, fontStyle: 'bold' });
        yPosition += 8;
        
        const lines = doc.splitTextToSize(options.notes, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 6 + 10;
      }

      // Footer
      yPosition = Math.max(yPosition, 260); // Ensure footer is near bottom
      doc.setDrawColor(211, 211, 211);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;
      
      addText('Thank you for your business!', 105, yPosition, { 
        fontSize: 11, 
        align: 'center' 
      });

      // Generate base64 string
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      console.log('jsPDF generated successfully, size:', pdfBase64.length);
      
      return pdfBase64;
    } catch (error) {
      console.error('Error in jsPDF generation:', error);
      throw error;
    }
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
        console.log(`Generating jsPDF for invoice ${invoice.invoice_number}...`);
        const pdf = await this.generateInvoicePdf(invoice, options);
        results.push({ invoice, pdf });
      } catch (error) {
        console.error(`Failed to generate jsPDF for invoice ${invoice.invoice_number}:`, error);
      }
    }
    
    return results;
  }
}
