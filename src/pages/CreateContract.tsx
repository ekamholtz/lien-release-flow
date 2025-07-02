import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ContractDocumentUploadCard } from "@/components/contracts/ContractDocumentUploadCard";
import { AgreementStatusCard } from "@/components/contracts/AgreementStatusCard";
import { DocxToHtmlViewerRef } from "@/components/contracts/PdfViewer";
import { convertDocxToHtml, htmlToBase64Pdf, htmlToBase64PdfString, pdfFileToBase64 } from "@/utils/htmlToBase64Pdf";
import { supabase } from "@/integrations/supabase/client";

const CreateContract: React.FC = () => {
  const navigate = useNavigate();
  const viewerRef = useRef<DocxToHtmlViewerRef>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"docx" | "pdf" | null>(null);
  const [signatureBoxes, setSignatureBoxes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "Sample Document",
    note: "Please sign the document",
    description: "Contract Agreement",
    timeToCompleteDays: 15,
    sendInOrder: true,
    enableOTP: false,
    allowModifications: false,
    autoReminder: false,
  });

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [agreementId, setAgreementId] = useState("");
  const [signedUrl, setSignedUrl] = useState("");

  const handleNext = async () => {
    try {
      if (!fileType) {
        toast.error("Please upload a .docx or .pdf file first.");
        return;
      }

      let base64File = "";
      if (fileType === "docx") {
        // base64File = await viewerRef.current!.getMergedHtml();
        const html = await convertDocxToHtml(file);
        base64File = await htmlToBase64PdfString(html);
      } else if (fileType === "pdf") {
        base64File = await pdfFileToBase64(file);
      }

      if (!base64File) {
        toast.error("Failed to generate document preview.");
        return;
      }

      navigate("/review-doc-pdf", {
        state: {
          base64: base64File,
          fileName: "Document",
          fileType,
          ...formData,
        },
      });
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("An unexpected error occurred while preparing the document.");
    }
  };

  const sendForSigning = async () => {
    const fileType = viewerRef.current?.getFileType?.();

    if (!viewerRef.current || !fileType) {
      toast.error("Document preview not ready.");
      return;
    }

    if (signatureBoxes.length === 0) {
      toast.error("Please add at least one signature box before submitting.");
      return;
    }

    let base64File = "";
    if (fileType === "docx") {
      base64File = await viewerRef.current.getMergedHtml();
    } else if (fileType === "pdf") {
      base64File = await viewerRef.current.getBase64();
    }

    setShowModal(false);
    setStatus("sending");

    try {
      const { data, error } = await supabase.functions.invoke("send-pdf-signature", {
        body: {
          file: base64File,
          ...formData,
          signers: [
            {
              role: "contractor",
              signing_order: 1,
              email: formData.email,
              name: formData.name,
              phone: formData.phone || "",
              widgets: signatureBoxes.map((box, i) => ({
                type: "signature",
                page: box.page,
                x: box.x,
                y: box.y,
                w: box.w,
                h: box.h,
                name: `signature_${i + 1}`,
              })),
            },
          ],
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        setStatus("error");
        return;
      }

      if (data?.objectId) {
        setAgreementId(data.objectId);
        setStatus("sent");
        toast.success("Document sent successfully.");
      } else {
        setStatus("error");
        toast.error("Failed to send document.");
      }
    } catch (err) {
      console.error("Function invoke failed:", err);
      setStatus("error");
      toast.error("Unexpected error while sending document.");
    }
  };

  const checkStatus = async () => {
    if (!agreementId) return;

    try {
      const { data, error } = await supabase.functions.invoke("get-contract-details", {
        body: { documentId: agreementId },
      });

      if (error) {
        console.error("Supabase function error:", error);
        return;
      }

      if (data?.status === "completed") {
        setSignedUrl(data.downloadUrl);
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  return (
    <AppLayout>
      <div className="w-full p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Create Contract</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <ContractDocumentUploadCard
            file={file}
            fileType={fileType}
            setFileType={setFileType}
            {...formData}
            setName={(v) => setFormData((p) => ({ ...p, name: v }))}
            setEmail={(v) => setFormData((p) => ({ ...p, email: v }))}
            setPhone={(v) => setFormData((p) => ({ ...p, phone: v }))}
            setTitle={(v) => setFormData((p) => ({ ...p, title: v }))}
            setNote={(v) => setFormData((p) => ({ ...p, note: v }))}
            setDescription={(v) => setFormData((p) => ({ ...p, description: v }))}
            setTimeToCompleteDays={(v) => setFormData((p) => ({ ...p, timeToCompleteDays: v }))}
            setSendInOrder={(v) => setFormData((p) => ({ ...p, sendInOrder: v }))}
            setEnableOTP={(v) => setFormData((p) => ({ ...p, enableOTP: v }))}
            setAllowModifications={(v) => setFormData((p) => ({ ...p, allowModifications: v }))}
            setAutoReminder={(v) => setFormData((p) => ({ ...p, autoReminder: v }))}
            setFile={setFile}
            onSubmit={handleNext}
            viewerRef={viewerRef}
            setSignatureBoxes={setSignatureBoxes}
            sendForSigning={sendForSigning}
            showModal={showModal}
            onClose={() => setShowModal(false)}
            status={status}
          />

          {agreementId && (
            <AgreementStatusCard
              agreementId={agreementId}
              signedUrl={signedUrl}
              checkStatus={checkStatus}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateContract;
