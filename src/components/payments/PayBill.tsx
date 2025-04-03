
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, Check, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { processCheckbookPayment } from "@/lib/payments/checkbook";
import { supabase } from "@/integrations/supabase/client";
import { DbBill } from "@/lib/supabase";

interface PayBillProps {
  bill: DbBill;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function PayBill({ bill, isOpen, onClose, onPaymentComplete }: PayBillProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Process payment with Checkbook.io (for bills we use Checkbook for pay-out)
      const paymentResponse = await processCheckbookPayment({
        recipient: {
          name: bill.vendor_name,
          email: bill.vendor_email,
        },
        amount: bill.amount,
        description: `Payment for Bill ${bill.bill_number}`,
        reference: bill.id
      });
      
      // Update bill status in Supabase
      const { error } = await supabase
        .from('bills')
        .update({
          status: 'paid',
          payment_id: paymentResponse.id,
          payment_date: new Date().toISOString(),
          payment_provider: 'checkbook',
          payment_reference: paymentResponse.checkbook_url
        })
        .eq('id', bill.id);
      
      if (error) {
        throw error;
      }
      
      setPaymentCompleted(true);
      setIsProcessing(false);
      
      toast({
        title: "Payment Sent",
        description: `Payment for bill ${bill.bill_number} has been sent to ${bill.vendor_name}.`,
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
                Payment Sent
              </div>
            ) : (
              <div className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Pay Bill
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {paymentCompleted 
              ? `Your payment for bill ${bill.bill_number} has been sent successfully.`
              : `Send payment for bill ${bill.bill_number} to ${bill.vendor_name} - $${bill.amount.toFixed(2)}`
            }
          </DialogDescription>
        </DialogHeader>
        
        {!paymentCompleted && (
          <div className="py-4">
            <div className="rounded-md bg-blue-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>A digital check will be sent via Checkbook.io to:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><strong>Vendor:</strong> {bill.vendor_name}</li>
                      <li><strong>Email:</strong> {bill.vendor_email}</li>
                      <li><strong>Amount:</strong> ${bill.amount.toFixed(2)}</li>
                    </ul>
                    <p className="mt-2">This is a demo payment. No real payments will be processed.</p>
                  </div>
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
                disabled={isProcessing}
                className="bg-construction-600 hover:bg-construction-700"
              >
                {isProcessing ? "Processing..." : `Send Payment $${bill.amount.toFixed(2)}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
