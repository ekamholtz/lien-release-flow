import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, XCircle } from "lucide-react";
import { OfflinePaymentData, PaymentMethod } from "@/lib/payments/types";

interface PayInvoiceDigitalStepProps {
  invoiceId: string;
  paymentMethod: PaymentMethod;
  onPaymentComplete?: (paymentId: string, offlineData?: OfflinePaymentData) => void;
  onPaymentError: (error: string) => void;
}

export function PayInvoiceDigitalStep({
  invoiceId,
  paymentMethod,
  onPaymentComplete,
  onPaymentError,
}: PayInvoiceDigitalStepProps) {
  const [sessionKey, setSessionKey] = useState("");
  const [payinConfigId, setPayinConfigId] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const initDigitalPayment = async () => {
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("amount, client_email, client_id, invoice_number, company_id")
        .eq("id", invoiceId)
        .single();

      if (fetchError || !invoice) {
        console.error("Failed to fetch invoice:", fetchError);
        onPaymentError("Unable to load invoice for payment.");
        return;
      }

      setAmount(invoice.amount);
      setInvoiceNumber(invoice.invoice_number);
      setCompanyId(invoice.company_id);

      const { data, error } = await supabase
        .from("payment_invoices")
        .select("session_key, payin_config_id")
        .eq("entity_number", invoice.invoice_number)
        .single();

      if (error || !data?.session_key || !data?.payin_config_id) {
        console.error("Session data invalid or missing:", error || data);
        onPaymentError("Failed to initialize payment session.");
        return;
      }

      setSessionKey(data.session_key);
      setPayinConfigId(data.payin_config_id);
      setLoading(false);
    };

    initDigitalPayment();
  }, [invoiceId, onPaymentError]);

  useEffect(() => {
    if (!sessionKey || !payinConfigId || !invoiceNumber) return;

    const comp = document.getElementById("rf-pay") as HTMLElement | null;
    if (!comp) return;

    const handleApproved = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const rainforestResponse = customEvent.detail[0]?.data;

      console.log("Rainforest payment approved:", rainforestResponse);

      try {
        if (!companyId) throw new Error("Missing company ID.");
        const paymentMethod = mapRainforestMethods(rainforestResponse);

        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert([
            {
              entity_type: "invoice",
              entity_id: invoiceId,
              amount,
              payment_method: paymentMethod,
              payment_provider: "rainforestpay",
              status: rainforestResponse?.status?.toLowerCase(),
              payment_date: new Date().toISOString(),
              is_offline: false,
              company_id: companyId,
              payor_name: rainforestResponse?.billing_contact?.name || null,
              payor_company: null,
            },
          ])
          .select()
          .single();

        if (paymentError) {
          console.error("Failed to save payment:", paymentError);
          throw paymentError;
        }

        console.log("Payment saved to DB:", payment);

        // Optional: update the status in payment_invoices table
        await supabase
          .from("payment_invoices")
          .update({
            status: rainforestResponse?.status,
            paid_at: new Date().toISOString(),
            payin_id: rainforestResponse?.payin_id,
          })
          .eq("entity_number", invoiceNumber);
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'sent' })
          .eq('id', invoiceId);
        console.error("Failed to update status payment: invoice", error);
        onPaymentComplete?.(payment.id);
      } catch (err) {
        console.error("Error in handleApproved:", err);
        onPaymentError("Payment approved but saving failed.");
      }
    };

    const handleDeclined = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.warn("Rainforest payment declined or errored:", customEvent.detail);

      await supabase
        .from("payment_invoices")
        .update({ status: "declined" })
        .eq("entity_number", invoiceNumber);
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId);
      console.error("Failed to update status payment: invoice", error);
      onPaymentError("Payment declined or failed.");
    };

    comp.addEventListener("approved", handleApproved as EventListener);
    comp.addEventListener("declined", handleDeclined as EventListener);
    comp.addEventListener("error", handleDeclined as EventListener);

    return () => {
      comp.removeEventListener("approved", handleApproved as EventListener);
      comp.removeEventListener("declined", handleDeclined as EventListener);
      comp.removeEventListener("error", handleDeclined as EventListener);
    };
  }, [
    sessionKey,
    payinConfigId,
    invoiceId,
    invoiceNumber,
    amount,
    companyId,
    onPaymentComplete,
    onPaymentError,
  ]);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://static.rainforestpay.com/sandbox.payment.js";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const mapRainforestMethods = (rf: any): string => {
    const method = rf.method_type;

    if (method === "CARD" && rf.card?.type === "CREDIT") return "credit_card";
    if (method === "APPLE_PAY" || method === "GOOGLE_PAY") return "credit_card";
    if (method === "ACH" || method === "PLAID_ACH") return "ach";

    // Default to credit_card if it's a card
    if (method === "CARD") return "credit_card";

    throw new Error(`Unsupported payment method type: ${method}`);
  };


  if (loading) {
    return <p className="text-center text-sm text-gray-500">Initializing payment...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden shadow-sm">
        <rainforest-payment
          id="rf-pay"
          session-key={sessionKey}
          payin-config-id={payinConfigId}
          allowed-methods={
            paymentMethod === "credit_card"
              ? "CARD"
              : paymentMethod === "ach"
                ? "ACH"
                : "CARD"
          }
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-500 flex items-center">
          <Lock className="h-4 w-4 mr-1" /> Encrypted & secure
        </p>
        <p className="text-xs text-gray-400 flex items-center">
          <XCircle className="h-4 w-4 mr-1" /> Do not close this window
        </p>
      </div>
    </div>
  );
}
