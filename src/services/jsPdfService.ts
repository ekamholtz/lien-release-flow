import jsPDF from 'jspdf';
import { Invoice, LineItem } from '@/lib/types/invoice';

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

export const generateInvoicePDF = async (
  invoice: Invoice,
  lineItems: LineItem[],
  companyProfile?: CompanyProfile
): Promise<string> => {
  try {
    const pdf = new jsPDF();
    
    // Set up fonts and styling
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    
    // Company header
    if (companyProfile?.name) {
      pdf.text(companyProfile.name, 20, 30);
    } else {
      pdf.text('Your Company', 20, 30);
    }
    
    // Company address
    let yPosition = 40;
    if (companyProfile?.street_address) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(companyProfile.street_address, 20, yPosition);
      yPosition += 5;
    }
    
    if (companyProfile?.city || companyProfile?.state) {
      const cityState = [companyProfile?.city, companyProfile?.state].filter(Boolean).join(', ');
      if (cityState) {
        pdf.text(cityState, 20, yPosition);
        yPosition += 5;
      }
    }
    
    if (companyProfile?.phone) {
      pdf.text(`Phone: ${companyProfile.phone}`, 20, yPosition);
      yPosition += 5;
    }
    
    if (companyProfile?.email) {
      pdf.text(`Email: ${companyProfile.email}`, 20, yPosition);
      yPosition += 10;
    }

    // Invoice details
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice', 150, 30);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice Number: ${invoice.invoice_number}`, 150, 40);
    pdf.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 150, 48);
    pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 56);

    // Customer details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill to:', 20, 70);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.customer_name, 20, 78);
    
    let customerYPosition = 86;
    if (invoice.customer_street_address) {
      pdf.text(invoice.customer_street_address, 20, customerYPosition);
      customerYPosition += 5;
    }
    
    if (invoice.customer_city || invoice.customer_state) {
      const cityState = [invoice.customer_city, invoice.customer_state].filter(Boolean).join(', ');
      if (cityState) {
        pdf.text(cityState, 20, customerYPosition);
        customerYPosition += 5;
      }
    }

    if (invoice.customer_email) {
      pdf.text(`Email: ${invoice.customer_email}`, 20, customerYPosition);
      customerYPosition += 5;
    }

    if (invoice.customer_phone) {
      pdf.text(`Phone: ${invoice.customer_phone}`, 20, customerYPosition);
      customerYPosition += 10;
    }

    // Line items table
    const tableColumnWidths = [70, 30, 40, 40];
    let tableXPosition = 20;
    let tableYPosition = customerYPosition + 5;

    // Table headers
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Item', tableXPosition, tableYPosition);
    tableXPosition += tableColumnWidths[0];
    pdf.text('Quantity', tableXPosition, tableYPosition);
    tableXPosition += tableColumnWidths[1];
    pdf.text('Unit Price', tableXPosition, tableYPosition);
    tableXPosition += tableColumnWidths[2];
    pdf.text('Total', tableXPosition, tableYPosition);

    tableYPosition += 7;
    pdf.line(20, tableYPosition, 195, tableYPosition);
    tableYPosition += 5;
    tableXPosition = 20;

    // Table rows
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    lineItems.forEach((item) => {
      tableXPosition = 20;
      pdf.text(item.description, tableXPosition, tableYPosition);
      tableXPosition += tableColumnWidths[0];
      pdf.text(item.quantity.toString(), tableXPosition, tableYPosition);
      tableXPosition += tableColumnWidths[1];
      pdf.text(`$${item.unit_price.toFixed(2)}`, tableXPosition, tableYPosition);
      tableXPosition += tableColumnWidths[2];
      pdf.text(`$${(item.quantity * item.unit_price).toFixed(2)}`, tableXPosition, tableYPosition);
      tableYPosition += 6;
    });

    // Total amount
    const totalAmount = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total: $${totalAmount.toFixed(2)}`, 150, tableYPosition + 15);

    return pdf.output('datauristring');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};
