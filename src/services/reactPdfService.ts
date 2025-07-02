
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
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

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  billToSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  billToColumn: {
    flex: 1,
    marginRight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  text: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.4,
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '50%',
  },
  infoValue: {
    fontSize: 12,
    width: '50%',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderBottom: '1pt solid #D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #E5E7EB',
  },
  tableCell: {
    fontSize: 10,
    flex: 1,
  },
  tableCellRight: {
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },
  summarySection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 12,
  },
  totalSection: {
    textAlign: 'right',
    marginBottom: 30,
    paddingTop: 20,
    borderTop: '2pt solid #1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notesSection: {
    marginBottom: 15,
  },
  footer: {
    textAlign: 'center',
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1pt solid #D1D5DB',
    color: '#6B7280',
    fontSize: 11,
  },
});

// Create the PDF document component
const InvoicePDF = ({ 
  invoice, 
  lineItems, 
  options 
}: {
  invoice: DbInvoice & { 
    projects?: { name: string };
    company?: { name: string };
  };
  lineItems: InvoiceLineItem[];
  options: PdfGenerationOptions;
}) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {invoice.company?.name || 'Your Company'}
            </Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <View style={styles.billToColumn}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.text}>{invoice.client_name}</Text>
            <Text style={styles.text}>{invoice.client_email}</Text>
          </View>
          <View style={styles.billToColumn}>
            <Text style={styles.sectionTitle}>Project:</Text>
            <Text style={styles.text}>{invoice.projects?.name || 'General'}</Text>
          </View>
        </View>

        {/* Invoice Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice Date:</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.due_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>{invoice.status}</Text>
          </View>
        </View>

        {/* Line Items - Detailed */}
        {options.showLineItems === 'detailed' && lineItems.length > 0 && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Category</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
              <Text style={styles.tableCellRight}>Cost</Text>
              <Text style={styles.tableCellRight}>Markup</Text>
              <Text style={styles.tableCellRight}>Price</Text>
            </View>
            {lineItems.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {item.category_name || 'Uncategorized'}
                </Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {item.description || '-'}
                </Text>
                <Text style={styles.tableCellRight}>
                  {formatCurrency(Number(item.cost))}
                </Text>
                <Text style={styles.tableCellRight}>
                  {item.markup_percentage}%
                </Text>
                <Text style={styles.tableCellRight}>
                  {formatCurrency(Number(item.price))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Line Items - Summary */}
        {options.showLineItems === 'summary' && lineItems.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Invoice Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Cost:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Markup:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalMarkup)}</Text>
            </View>
            <View style={[styles.summaryRow, { paddingTop: 10, borderTop: '2pt solid #1F2937' }]}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={styles.summaryLabel}>{formatCurrency(totalPrice)}</Text>
            </View>
          </View>
        )}

        {/* Total Amount */}
        <View style={styles.totalSection}>
          <Text style={styles.totalAmount}>
            Total: {formatCurrency(Number(invoice.amount))}
          </Text>
        </View>

        {/* Payment Terms */}
        {options.paymentTerms && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.text}>{options.paymentTerms}</Text>
          </View>
        )}

        {/* Notes */}
        {options.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.text}>{options.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export class ReactPdfService {
  static async generateInvoicePdf(
    invoice: DbInvoice & { 
      projects?: { name: string };
      company?: { name: string };
    },
    options: PdfGenerationOptions
  ): Promise<string> {
    console.log('=== React PDF Generation Started ===');
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

    try {
      // Create the PDF document
      const doc = <InvoicePDF invoice={invoice} lineItems={lineItems} options={options} />;
      
      // Generate PDF blob
      const blob = await pdf(doc).toBlob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log('React PDF generated successfully, size:', base64.length);
      return base64;
    } catch (error) {
      console.error('Error in React PDF generation:', error);
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
        console.log(`Generating React PDF for invoice ${invoice.invoice_number}...`);
        const pdf = await this.generateInvoicePdf(invoice, options);
        results.push({ invoice, pdf });
      } catch (error) {
        console.error(`Failed to generate React PDF for invoice ${invoice.invoice_number}:`, error);
      }
    }
    
    return results;
  }
}
