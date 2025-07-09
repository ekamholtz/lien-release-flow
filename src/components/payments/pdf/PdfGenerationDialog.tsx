import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Download, Eye, Building } from 'lucide-react';
import { DbInvoice } from '@/lib/supabase';
import { JsPdfService, PdfGenerationOptions } from '@/services/jsPdfService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceLineItem {
  id: string;
  description: string;
  cost: number;
  markup_percentage: number;
  price: number;
  category_name?: string;
}

interface PdfGenerationDialogProps {
  invoice: DbInvoice & { 
    projects?: { name: string };
    company?: { name: string };
  };
  isOpen: boolean;
  onClose: () => void;
}

export function PdfGenerationDialog({ invoice, isOpen, onClose }: PdfGenerationDialogProps) {
  const [options, setOptions] = useState<PdfGenerationOptions>({
    showLineItems: 'summary',
    paymentTerms: 'Payment is due within 30 days of invoice date.',
    notes: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Load company logo and line items when dialog opens
  useEffect(() => {
    if (isOpen && invoice.company_id) {
      loadCompanyData();
      loadLineItems();
    }
  }, [isOpen, invoice.company_id, invoice.id]);

  const loadCompanyData = async () => {
    if (!invoice.company_id) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', invoice.company_id)
        .single();
      
      if (!error && data?.logo_url) {
        setCompanyLogo(data.logo_url);
        setOptions(prev => ({ ...prev, companyLogo: data.logo_url }));
      }
    } catch (error) {
      console.error('Error loading company logo:', error);
    }
  };

  const loadLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select(`
          id,
          description,
          cost,
          markup_percentage,
          price,
          expense_categories(name)
        `)
        .eq('invoice_id', invoice.id);

      if (!error && data) {
        const formattedLineItems = data.map(item => ({
          id: item.id,
          description: item.description || '',
          cost: Number(item.cost || 0),
          markup_percentage: Number(item.markup_percentage || 0),
          price: Number(item.price),
          category_name: (item.expense_categories as any)?.name || 'Uncategorized'
        }));
        setLineItems(formattedLineItems);
      }
    } catch (error) {
      console.error('Error loading line items:', error);
      setLineItems([]);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      const pdfBase64 = await JsPdfService.generateInvoicePdf(invoice, options, lineItems);
      setGeneratedPdf(pdfBase64);
      
      toast({
        title: "PDF Generated",
        description: "Your professional invoice PDF has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (generatedPdf) {
      const fileName = `invoice-${invoice.invoice_number}.pdf`;
      JsPdfService.downloadPdf(generatedPdf, fileName);
    }
  };

  const handlePreviewPdf = () => {
    if (generatedPdf) {
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(`
          <iframe 
            src="data:application/pdf;base64,${generatedPdf}" 
            style="width:100%; height:100%; border:none;"
            title="Invoice PDF Preview"
          ></iframe>
        `);
      }
    }
  };

  const resetDialog = () => {
    setGeneratedPdf(null);
    setOptions({
      showLineItems: 'summary',
      paymentTerms: 'Payment is due within 30 days of invoice date.',
      notes: '',
      companyLogo: companyLogo
    });
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Generate Professional Invoice PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Line Items Display</Label>
            <RadioGroup
              value={options.showLineItems}
              onValueChange={(value) => setOptions(prev => ({ 
                ...prev, 
                showLineItems: value as 'none' | 'summary' | 'detailed' 
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="text-sm">None - Show only total amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="text-sm">Summary - Show cost breakdown and totals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="text-sm">Detailed - Show all line items with categories</Label>
              </div>
            </RadioGroup>
            {lineItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Found {lineItems.length} line item(s) for this invoice
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo" className="text-sm font-medium">Company Logo</Label>
            <div className="space-y-3">
              {(options.companyLogo || companyLogo) && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <img 
                    src={options.companyLogo || companyLogo} 
                    alt="Company logo preview" 
                    className="h-12 w-12 object-contain border rounded"
                  />
                  <div className="text-sm">
                    <p className="font-medium">Current company logo</p>
                    <p className="text-muted-foreground">Will be included in the PDF</p>
                  </div>
                </div>
              )}
              <Input
                id="companyLogo"
                placeholder="https://example.com/logo.png"
                value={options.companyLogo || ''}
                onChange={(e) => setOptions(prev => ({ ...prev, companyLogo: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Override the company logo with a different URL, or leave empty to use the company's default logo
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms" className="text-sm font-medium">Payment Terms</Label>
            <Textarea
              id="paymentTerms"
              placeholder="Enter payment terms..."
              value={options.paymentTerms || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, paymentTerms: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Enter any additional notes..."
              value={options.notes || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!generatedPdf ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGeneratePdf} 
                disabled={isGenerating}
                className="bg-construction-600 hover:bg-construction-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Professional PDF'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetDialog}>
                Generate New PDF
              </Button>
              <Button variant="outline" onClick={handlePreviewPdf}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button 
                onClick={handleDownloadPdf}
                className="bg-construction-600 hover:bg-construction-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
