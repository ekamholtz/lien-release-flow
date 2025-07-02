import React, { useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LienReleaseForm, LienReleaseFormRef } from "@/components/payments/LienReleaseForm";
import DocxToHtmlViewer, {
  DocxToHtmlViewerRef,
} from "@/components/contracts/DocxToHtmlViewer";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LienRelease = () => {
  const navigate = useNavigate();
  const viewerRef = useRef<DocxToHtmlViewerRef>(null);
  const formRef = useRef<LienReleaseFormRef>(null);

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [signatureBoxes, setSignatureBoxes] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [fileType, setFileType] = useState<"docx" | "pdf" | null>(null);

  const handleNextToSubmit = async (values: any) => {
    const htmlContent = viewerRef.current?.getHtmlContent();
    if (!htmlContent) {
      toast.error("Please upload a .docx file first.");
      return;
    }

    setFormValues(values);
    await viewerRef.current?.getMergedHtml(values); // Ensure preview is merged
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!viewerRef.current) {
      toast.error("Document preview not ready.");
      return;
    }

    setShowModal(false);
    setStatus("sending");

    try {
      const base64File = await viewerRef.current.getMergedHtml(formValues);

      navigate("/review-doc-pdf", {
        state: {
          base64: base64File,
          fileName: "LienRelease.pdf",
          fileType,
          name: formValues.contractorName,
          title: formValues.releaseType,
          email: formValues.contractorMail,
        },
      });
    } catch (err) {
      setStatus("error");
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate or preview the document.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create Lien Release</h1>

        <div className="dashboard-card">
          <DocxToHtmlViewer
            ref={viewerRef}
            setFileType={setFileType}
            onSubmit={handleSubmit}
            onClose={() => setShowModal(false)}
            showModal={showModal}
            title="lien-release"
          />

          <LienReleaseForm
            ref={formRef}
            onSubmit={handleNextToSubmit}
            status={status}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default LienRelease;
