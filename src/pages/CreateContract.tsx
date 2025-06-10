import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ContractDocumentUploadCard } from "@/components/contracts/ContractDocumentUploadCard";
import { AgreementStatusCard } from "@/components/contracts/AgreementStatusCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const sendForSigning = async () => {
    if (!file || !email || !name) return;
    setStatus("sending");

    try {
      const base64File = await toBase64(file);

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
            setPhone={setPhone}
            setTitle={setTitle}
            setNote={setNote}
            setDescription={setDescription}
            setTimeToCompleteDays={setTimeToCompleteDays}
            setSendInOrder={setSendInOrder}
            setEnableOTP={setEnableOTP}
            setAllowModifications={setAllowModifications}
            setAutoReminder={setAutoReminder}
            onSubmit={sendForSigning}
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
