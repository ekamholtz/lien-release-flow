
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, FileText } from 'lucide-react';
import { DbInvoice } from '@/lib/supabase';
import { PdfService, PdfGenerationOptions } from '@/services/pdfService';
import { toast } from '@/hooks/use-toast';

interface BatchPdfDialogProps {
  invoices: (DbInvoice & { 
    projects?: { name: string };
    company?: { name: string };
  })[];
  isOpen: boolean;
  onClose: () => void;
}

export function BatchPdfDialog({ invoices, isOpen, onClose }: BatchPdfDialogProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [options, setOptions] = useState<PdfGenerationOptions>({
    showLineItems: 'summary',
    paymentTerms: 'Payment is due within 30 days of invoice date.',
    notes: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map(inv => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleGenerateBatchPdfs = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select at least one invoice to generate PDFs.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const selectedInvoiceObjects = invoices.filter(inv => selectedInvoices.includes(inv.id));
      const results = await PdfService.generateBatchPdfs(selectedInvoiceObjects, options);
      
      // Download each PDF
      results.forEach(({ invoice, pdf }) => {
        const fileName = `invoice-${invoice.invoice_number}.pdf`;
        PdfService.downloadPdf(pdf, fileName);
      });
      
      toast({
        title: "PDFs Generated",
        description: `Successfully generated ${results.length} invoice PDFs.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating batch PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDFs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetDialog = () => {
    setSelectedInvoices([]);
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Generate Batch Invoice PDFs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 overflow-y-auto">
          {/* Invoice Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectedInvoices.length === invoices.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll" className="text-sm font-medium">
                Select All ({invoices.length} invoices)
              </Label>
            </div>
            
            <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={invoice.id}
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                  />
                  <Label htmlFor={invoice.id} className="text-sm flex-1">
                    #{invoice.invoice_number} - {invoice.client_name} - ${invoice.amount}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Options */}
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
                <RadioGroupItem value="none" id="batch-none" />
                <Label htmlFor="batch-none" className="text-sm">None - Show only total amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="batch-summary" />
                <Label htmlFor="batch-summary" className="text-sm">Summary - Show cost, markup, and total</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="batch-detailed" />
                <Label htmlFor="batch-detailed" className="text-sm">Detailed - Show all line items</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-companyLogo" className="text-sm font-medium">Company Logo URL (Optional)</Label>
            <Input
              id="batch-companyLogo"
              placeholder="https://example.com/logo.png"
              value={options.companyLogo || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, companyLogo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-paymentTerms" className="text-sm font-medium">Payment Terms</Label>
            <Textarea
              id="batch-paymentTerms"
              placeholder="Enter payment terms..."
              value={options.paymentTerms || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, paymentTerms: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-notes" className="text-sm font-medium">Additional Notes (Optional)</Label>
            <Textarea
              id="batch-notes"
              placeholder="Enter any additional notes..."
              value={options.notes || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateBatchPdfs} 
            disabled={isGenerating || selectedInvoices.length === 0}
            className="bg-construction-600 hover:bg-construction-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate {selectedInvoices.length} PDFs
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
