import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function CreateInvoice() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
   const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
    const { data, error } = await supabase.functions.invoke("create-invoice", {
      body: {
        amount: 5000,
        currency: "USD",
        email: "customer@example.com",
        description: "Lien Release Fee",
        user_id:user.id
      },
    });

    setLoading(false);

    if (error || !data?.paymentUrl) {
      console.error("Edge Fn error", error || data);
      return alert("Failed to create invoice – see console.");
    }

    setLink(data.paymentUrl);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreate}
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Invoice"}
      </button>

      {link && (
        <p className="break-all text-green-600">
          Payment Link:{" "}
          <a href={link} target="_blank" rel="noreferrer" className="underline">
            {link}
          </a>
        </p>
      )}
    </div>
  );
}

/* ──────────────────── default export for convenience ──────────────────── */
export default CreateInvoice;
