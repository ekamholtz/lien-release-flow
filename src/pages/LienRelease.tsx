
import React, { useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LienReleaseForm, LienReleaseFormRef } from "@/components/payments/LienReleaseForm";
import DocxToHtmlViewer, {
  DocxToHtmlViewerRef,
} from "@/components/contracts/DocxToHtmlViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LienRelease = () => {
  const viewerRef = useRef<DocxToHtmlViewerRef>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [signatureBoxes, setSignatureBoxes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<any>(null);

  const handleSubmit = async () => {
    if (!viewerRef.current) {
      toast.error("Document preview not ready.");
      return;
    }
    setShowModal(false);
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
          signers: [
            {
              role: "contractor",
              signing_order: 1,
              email: formValues.contractorMail,
              name: formValues.contractorName,
              phone: formValues.contractorPhone || "",
              widgets: signatureBoxes.map((box, index) => ({
                type: "signature",
                page: 1,
                x: box.x,
                y: box.y,
                w: box.w,
                h: box.h,
                name: `signature_${index + 1}`,
              }))
            }
          ]
        },
      });

      if (error) throw error;

      if (data?.objectId) {
        setStatus("sent");
        toast.success("Document sent successfully.");
      } else {
        throw new Error("Unexpected response");
      }

    } catch (err) {
      setStatus("error");
      console.error("Submission failed:", err);
      toast.error("Failed to send document.");
    }
  };

  const handleNextToSubmit = async (values: any) => {
    if (!viewerRef.current) {
      toast.error("Document preview not ready.");
      return;
    }

    try {
      // Get project name from projectId
      let projectName = "";
      if (values.projectId) {
        const { data: project, error } = await supabase
          .from('projects')
          .select('name')
          .eq('id', values.projectId)
          .single();

        if (error) {
          console.error("Error fetching project:", error);
          toast.error("Failed to load project details");
          return;
        }
        
        projectName = project?.name || "";
      }

      // Create enhanced form values with project name for template
      const enhancedValues = {
        ...values,
        projectName,
      };

      const base64File = await viewerRef.current.getMergedHtml(enhancedValues);
      setFormValues(enhancedValues);
      setShowModal(true);
    } catch (err) {
      console.error("Error preparing document:", err);
      toast.error("Failed to prepare document for preview");
    }
  };

  const formRef = useRef<LienReleaseFormRef>(null);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Lien Release</h1>

        <div className="dashboard-card">
          <DocxToHtmlViewer ref={viewerRef} setSignatureBoxes={setSignatureBoxes} onSubmit={handleSubmit} showModal={showModal} onClose={() => setShowModal(false)} />
          <LienReleaseForm ref={formRef} onSubmit={handleNextToSubmit} status={status} />
        </div>
      </div>
    </AppLayout>
  );
};

export default LienRelease;
