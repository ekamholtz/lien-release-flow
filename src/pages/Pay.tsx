import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, XCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export default function Pay() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const cfg = params.get("cfg");
  const sk = params.get("sk");
  const invoiceNumber = params.get("inv");

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://static.rainforestpay.com/sandbox.payment.js";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!cfg || !sk || !invoiceNumber) return;

    const fetchAndInsertPayment = async () => {
      setLoading(true);

      // Fetch invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("invoice_number ,client_name , client_email , amount, id")
        .eq("invoice_number", invoiceNumber)
        .single();

      if (invoiceError) {
        console.error("Invoice fetch error:", invoiceError);
        setLoading(false);
        return;
      }

      setInvoice(invoice);

      setLoading(false);
    };

    fetchAndInsertPayment();
  }, [cfg, sk, invoiceNumber]);


  useEffect(() => {
    if (!cfg || !sk) return;

    const comp = document.getElementById("rf-pay") as HTMLElement | null;
    if (!comp) return;

    const handleApproved = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const rainforestResponse = customEvent.detail[0]?.data;

      console.log("Rainforest payment approved:", rainforestResponse);
      const paymentMethod = mapRainforestMethods(rainforestResponse);
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            entity_type: "invoice",
            entity_id: invoice?.invoiceId,
            amount:invoice?.amount,
            payment_method: paymentMethod,
            payment_provider: "rainforestpay",
            status: rainforestResponse?.status?.toLowerCase(),
            payment_date: new Date().toISOString(),
            is_offline: false,
            company_id: invoice.companyId,
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

      if (invoiceNumber) {
        await supabase
          .from("payment_invoices")
          .update({
            status: rainforestResponse?.status,
            paid_at: new Date().toISOString(),
            payin_id: rainforestResponse?.payin_id,
          })
          .eq("entity_number", invoiceNumber);
      }
      navigate("/pay/success");
    };

    const handleDeclined = async () => {
      if (invoiceNumber) {
        await supabase
        .from("payment_invoices")
        .update({ status: "DECLINED" })
        .eq("entity_number", invoiceNumber);
      }
      navigate("/pay/failure");
    };

    comp.addEventListener("approved", handleApproved as EventListener);
    comp.addEventListener("declined", handleDeclined as EventListener);
    comp.addEventListener("error", handleDeclined as EventListener);

    return () => {
      comp.removeEventListener("approved", handleApproved as EventListener);
      comp.removeEventListener("declined", handleDeclined as EventListener);
      comp.removeEventListener("error", handleDeclined as EventListener);
    };
  }, [cfg, sk, invoiceNumber, navigate]);

  const mapRainforestMethods = (rf: any): string => {
    const method = rf.method_type;

    if (method === "CARD" && rf.card?.type === "CREDIT") return "credit_card";
    if (method === "APPLE_PAY" || method === "GOOGLE_PAY") return "credit_card";
    if (method === "ACH" || method === "PLAID_ACH") return "ach";

    // Default to credit_card if it's a card
    if (method === "CARD") return "credit_card";

    throw new Error(`Unsupported payment method type: ${method}`);
  };

  if (!cfg || !sk) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        <p className="text-lg font-medium">Invalid payment link.</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">Secure Payment</h1>

          {loading ? (
            <p className="text-center text-gray-500">Loading invoice...</p>
          ) : invoice ? (
            <div className="border rounded-lg p-4 text-sm bg-gray-50">
              <p><span className="font-medium">Invoice ID:</span> {invoice.invoice_number}</p>
              <p><span className="font-medium">Name:</span> {invoice.client_name}</p>
              <p><span className="font-medium">Email:</span> {invoice.client_email}</p>
              <p><span className="font-medium">Amount:</span> {invoice.amount} {invoice.currency}</p>
            </div>
          ) : (
            <p className="text-center text-red-500">Invoice not found</p>
          )}

          <div className="border rounded-xl overflow-hidden shadow-sm">
            <rainforest-payment
              id="rf-pay"
              session-key={sk}
              payin-config-id={cfg}
              allowed-methods="CARD,ACH"
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500 flex items-center">
              <Lock className="h-4 w-4 mr-1" /> Encrypted & secure
            </p>
            <button
              onClick={() => navigate("/pay/failure")}
              className="flex items-center gap-1 text-sm text-red-500 hover:underline"
            >
              <XCircle className="h-4 w-4" /> Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
