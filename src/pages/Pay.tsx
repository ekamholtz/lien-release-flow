import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, XCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export default function Pay() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const cfg = params.get("cfg");
  const invoiceNumber = params.get("inv");

  const [invoice, setInvoice] = useState<any | null>(null);
  const invoiceRef = useRef<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

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
    if (!cfg || !invoiceNumber) return;

    const fetchInvoiceAndSession = async () => {
      setLoading(true);

      // Fetch invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("invoice_number, client_name, client_email, amount, id, company_id")
        .eq("invoice_number", invoiceNumber)
        .single();

      if (invoiceError) {
        console.error("Invoice fetch error:", invoiceError);
        setLoading(false);
        return;
      }

      setInvoice(invoice);
      invoiceRef.current = invoice;

      const { data, error } = await supabase.functions.invoke("create-session", {
        body: {
          invoice_number: invoice.invoice_number,
          payin_config_id: cfg,
          amount: invoice.amount,
          currency: "USD",
        },
      });

      if (error) {
        console.error("Failed to create session:", error);
        setLoading(false);
        return;
      }

      console.log("Session created:", data);
      setSessionKey(data.session_key);
      setLoading(false);
    };

    fetchInvoiceAndSession();
  }, [cfg, invoiceNumber]);

  useEffect(() => {
    if (!cfg || !sessionKey) return;
    invoiceRef.current = invoice;
    const comp = document.getElementById("rf-pay") as HTMLElement | null;
    if (!comp) return;

    const handleApproved = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const rainforestResponse = customEvent.detail[0]?.data;

      const { data: invoice } = await supabase
        .from("invoices")
        .select("invoice_number, client_name, client_email, amount, id, company_id")
        .eq("invoice_number", invoiceNumber)
        .single();

      const paymentMethod = mapRainforestMethods(rainforestResponse);

      const { error: paymentError } = await supabase.from("payments").insert([
        {
          entity_type: "invoice",
          entity_id: invoice.id,
          amount: invoice.amount,
          payment_method: paymentMethod,
          payment_provider: "rainforestpay",
          status: rainforestResponse?.status?.toLowerCase(),
          payment_date: new Date().toISOString(),
          is_offline: false,
          company_id: invoice.company_id,
          payor_name: rainforestResponse?.billing_contact?.name || null,
          payor_company: null,
        },
      ]);

      if (paymentError) {
        console.error("Failed to save payment:", paymentError);
      }

      if (invoiceNumber) {
        await supabase
          .from("payment_invoices")
          .update({
            status: rainforestResponse?.status,
            paid_at: new Date().toISOString(),
            payin_id: rainforestResponse?.payin_id,
          })
          .eq("entity_number", invoiceNumber);

        await supabase
          .from("invoices")
          .update({ status: "sent" })
          .eq("id", invoice.id)
          .eq("company_id", invoice.company_id);
      }

      navigate("/pay/success");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate("/dashboard");
    };

    const handleDeclined = async () => {
      if (invoiceNumber) {
        await supabase.from("payment_invoices").update({ status: "declined" }).eq("entity_number", invoiceNumber);
      }
      navigate("/pay/failure");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate("/dashboard");
    };

    comp.addEventListener("approved", handleApproved as EventListener);
    comp.addEventListener("declined", handleDeclined as EventListener);
    comp.addEventListener("error", handleDeclined as EventListener);

    return () => {
      comp.removeEventListener("approved", handleApproved as EventListener);
      comp.removeEventListener("declined", handleDeclined as EventListener);
      comp.removeEventListener("error", handleDeclined as EventListener);
    };
  }, [cfg, sessionKey, invoice, invoiceNumber, navigate]);

  const mapRainforestMethods = (rf: any): string => {
    const method = rf.method_type;
    if (method === "CARD" && rf.card?.type === "CREDIT") return "credit_card";
    if (method === "APPLE_PAY" || method === "GOOGLE_PAY") return "credit_card";
    if (method === "ACH" || method === "PLAID_ACH") return "ach";
    if (method === "CARD") return "credit_card";
    throw new Error(`Unsupported payment method type: ${method}`);
  };

  if (!cfg || !invoiceNumber) {
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

          {sessionKey && (
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <rainforest-payment
                id="rf-pay"
                session-key={sessionKey}
                payin-config-id={cfg}
                allowed-methods="CARD,ACH"
              />
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500 flex items-center">
              <Lock className="h-4 w-4 mr-1" /> Encrypted & secure
            </p>
            <button
              onClick={() => navigate("/dashboard")}
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
