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
        .select("invoice_number ,client_name , client_email , amount")
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

    const handleApproved = async () => {
      if (invoiceNumber) {
        await supabase
          .from("payment_invoices")
          .update({ status: "approved", paid_at: new Date().toISOString() })
          .eq("id", invoiceNumber);
      }
      navigate("/pay/success");
    };

    const handleDeclined = async () => {
      if (invoiceNumber) {
        await supabase
          .from("payment_invoices")
          .update({ status: "declined" })
          .eq("id", invoiceNumber);
      }
      navigate("/pay/failure");
    };

    comp.addEventListener("approved", handleApproved);
    comp.addEventListener("declined", handleDeclined);
    comp.addEventListener("error", handleDeclined);

    return () => {
      comp.removeEventListener("approved", handleApproved);
      comp.removeEventListener("declined", handleDeclined);
      comp.removeEventListener("error", handleDeclined);
    };
  }, [cfg, sk, invoiceNumber, navigate]);

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
