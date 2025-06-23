import React, { useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LienReleaseForm } from "@/components/payments/LienReleaseForm";
import DocxToHtmlViewer, {
  DocxToHtmlViewerRef,
} from "@/components/contracts/DocxToHtmlViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LienRelease = () => {

  const viewerRef = useRef<DocxToHtmlViewerRef>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (formValues: any) => {
    
    if (!viewerRef.current) {
      toast.error("Document preview not ready.");
      return;
    }

    setStatus("sending");

    try {
      const base64File = await viewerRef.current.getMergedHtml(formValues);

      const { data, error } = await supabase.functions.invoke("send-pdf-signature", {
        body: {
          file: base64File,
          email: formValues.contractorMail,
          name: formValues.contractorName,
          title: "Signing Document",
          note: "Please sign the document",
          description: "Contract Agreement",
        },
      });

      if (error) throw error;

      if (data?.objectId) {
        setStatus('sent');
        toast.success('Document sent successfully.');
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      setStatus('error');
      console.error("Submission failed:", err);
      toast.error("Failed to send document.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Lien Release</h1>
        
        <div className="dashboard-card">
          <DocxToHtmlViewer ref={viewerRef} />
          <LienReleaseForm onSubmit={handleSubmit} status={status}/>
          {/* <RainforestPayment /> */}
        </div>
      </div>
    </AppLayout>
  );
};

export default LienRelease;
