
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Check } from 'lucide-react';

interface PayInvoiceCompleteStepProps {
  invoiceNumber: string;
  onClose: () => void;
}

export function PayInvoiceCompleteStep({ invoiceNumber, onClose }: PayInvoiceCompleteStepProps) {
  return (
    <div className="py-8 text-center">
      <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
      <p className="text-lg font-medium mb-2">Payment Completed Successfully!</p>
      <p className="text-muted-foreground">
        Invoice {invoiceNumber} has been marked as paid.
      </p>
      
      <DialogFooter className="mt-6">
        <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}
