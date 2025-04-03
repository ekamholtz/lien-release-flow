
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { processFinixPayment } from "@/lib/payments/finix";
import { supabase } from "@/integrations/supabase/client";
import { DbInvoice } from "@/lib/supabase";

interface PayInvoiceProps {
  invoice: DbInvoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function PayInvoice({ invoice, isOpen, onClose, onPaymentComplete }: PayInvoiceProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Process payment with Finix (for invoices we use Finix for pay-in)
      const paymentResponse = await processFinixPayment({
        source: {
          name: nameOnCard,
          email: "payer@example.com",
        },
        amount: invoice.amount,
        currency: "USD",
        description: `Payment for Invoice ${invoice.invoice_number}`,
        reference: invoice.id
      });
      
      // Update invoice status in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_id: paymentResponse.id,
          payment_date: new Date().toISOString(),
          payment_provider: 'finix',
          payment_link: paymentResponse.payment_link
        })
        .eq('id', invoice.id);
      
      if (error) {
        throw error;
      }
      
      setPaymentCompleted(true);
      setIsProcessing(false);
      
      toast({
        title: "Payment Successful",
        description: `Payment for invoice ${invoice.invoice_number} has been processed successfully.`,
      });
      
      // Wait 2 seconds before closing for user to see success message
      setTimeout(() => {
        onPaymentComplete();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error("Payment processing error:", error);
      setIsProcessing(false);
      
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {paymentCompleted ? (
              <div className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Payment Successful
              </div>
            ) : (
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Pay Invoice
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {paymentCompleted 
              ? `Your payment for invoice ${invoice.invoice_number} has been processed successfully.`
              : `Complete payment for invoice ${invoice.invoice_number} - $${invoice.amount.toFixed(2)}`
            }
          </DialogDescription>
        </DialogHeader>
        
        {!paymentCompleted && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name on Card</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div className="rounded-md bg-blue-50 p-3 mt-2">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3 text-sm text-blue-700">
                  <p>This is a demo payment form. No real payments will be processed.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {paymentCompleted ? (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing || !cardNumber || !expiryDate || !cvv || !nameOnCard}
                className="bg-construction-600 hover:bg-construction-700"
              >
                {isProcessing ? "Processing..." : `Pay $${invoice.amount.toFixed(2)}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
