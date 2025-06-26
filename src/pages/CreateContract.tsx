import React, { useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ContractDocumentUploadCard } from "@/components/contracts/ContractDocumentUploadCard";
import { AgreementStatusCard } from "@/components/contracts/AgreementStatusCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DocxToHtmlViewer, { DocxToHtmlViewerRef } from "@/components/contracts/DocxToHtmlViewer";
import { toast } from "sonner";

const CreateContract: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("Sample Document");
  const [note, setNote] = useState("Please sign the document");
  const [description, setDescription] = useState("Contract Agreement");
  const [timeToCompleteDays, setTimeToCompleteDays] = useState(15);
  const [sendInOrder, setSendInOrder] = useState(true);
  const [enableOTP, setEnableOTP] = useState(false);
  const [allowModifications, setAllowModifications] = useState(false);
  const [autoReminder, setAutoReminder] = useState(false);

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [agreementId, setAgreementId] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const viewerRef = useRef<DocxToHtmlViewerRef>(null);
  const [signatureBoxes, setSignatureBoxes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1]); // Remove base64 prefix
        } else {
          reject("Failed to convert file to base64");
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleNext = () => {
    setShowModal(true);
  }

  const sendForSigning = async () => {
    if (!email || !name) return;
    if (!viewerRef.current) {
      toast.error("Document preview not ready.");
      return;
    }
    const base64File = await viewerRef.current.getMergedHtml();
    setShowModal(false);
    setStatus("sending");
    try {
      // const base64File = await toBase64(file);

      const { data, error } = await supabase.functions.invoke("send-pdf-signature", {
        body: {
          file: base64File,
          email,
          name,
          phone,
          title,
          note,
          description,
          timeToCompleteDays,
          sendInOrder,
          enableOTP,
          allowModifications,
          autoReminder,
          signers: [
            {
              role: "contractor",
              signing_order: 1,
              email: email,
              name: name,
              phone: phone || "",
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

      if (error) {
        console.error("Supabase function error:", error);
        setStatus("error");
        return;
      }

      if (data?.objectId) {
        setAgreementId(data.objectId);
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Function invoke failed:", err);
      setStatus("error");
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Create Contract</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <ContractDocumentUploadCard
            file={file}
            name={name}
            setPhone={setPhone}
            email={email}
            phone={phone}
            title={title}
            note={note}
            description={description}
            timeToCompleteDays={timeToCompleteDays}
            sendInOrder={sendInOrder}
            enableOTP={enableOTP}
            allowModifications={allowModifications}
            autoReminder={autoReminder}
            status={status}
            setFile={setFile}
            setName={setName}
            setEmail={setEmail}
            setTitle={setTitle}
            setNote={setNote}
            setDescription={setDescription}
            setTimeToCompleteDays={setTimeToCompleteDays}
            setSendInOrder={setSendInOrder}
            setEnableOTP={setEnableOTP}
            setAllowModifications={setAllowModifications}
            setAutoReminder={setAutoReminder}
            onSubmit={handleNext}
            viewerRef={viewerRef}
            setSignatureBoxes={setSignatureBoxes}
            sendForSigning={sendForSigning}
            showModal={showModal}
            onClose={() => setShowModal(false)}
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
