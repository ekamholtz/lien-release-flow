
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Download, Eye } from 'lucide-react';
import { DbInvoice } from '@/lib/supabase';
import { PdfService, PdfGenerationOptions } from '@/services/pdfService';
import { toast } from '@/hooks/use-toast';

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

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      const pdfBase64 = await PdfService.generateInvoicePdf(invoice, options);
      setGeneratedPdf(pdfBase64);
      
      toast({
        title: "PDF Generated",
        description: "Your invoice PDF has been generated successfully.",
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
      PdfService.downloadPdf(generatedPdf, fileName);
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
      notes: ''
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
          <DialogTitle>Generate Invoice PDF</DialogTitle>
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
                <Label htmlFor="summary" className="text-sm">Summary - Show cost, markup, and total</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="text-sm">Detailed - Show all line items</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo" className="text-sm font-medium">Company Logo URL (Optional)</Label>
            <Input
              id="companyLogo"
              placeholder="https://example.com/logo.png"
              value={options.companyLogo || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, companyLogo: e.target.value }))}
            />
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
                  'Generate PDF'
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
