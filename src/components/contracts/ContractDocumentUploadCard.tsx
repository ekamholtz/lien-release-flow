import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DocxToHtmlViewerRef } from "./PdfViewer";

type Props = {
  file: File | null;
  fileType: "docx" | "pdf" | null;
  name: string;
  email: string;
  phone: string;
  title: string;
  note: string;
  description: string;
  timeToCompleteDays: number;
  sendInOrder: boolean;
  enableOTP: boolean;
  allowModifications: boolean;
  autoReminder: boolean;
  status: "idle" | "sending" | "sent" | "error";
  setFile: (file: File | null) => void;
  setFileType: (type: "pdf" | "docx") => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPhone: (val: string) => void;
  setTitle: (val: string) => void;
  setNote: (val: string) => void;
  setDescription: (val: string) => void;
  setTimeToCompleteDays: (val: number) => void;
  setSendInOrder: (val: boolean) => void;
  setEnableOTP: (val: boolean) => void;
  setAllowModifications: (val: boolean) => void;
  setAutoReminder: (val: boolean) => void;
  onSubmit: () => void;
  setSignatureBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  onClose: () => void;
  sendForSigning: () => void;
  showModal: boolean;
  viewerRef: React.RefObject<DocxToHtmlViewerRef>;
};

export const ContractDocumentUploadCard: React.FC<Props> = ({
  file,
  name,
  email,
  phone,
  title,
  note,
  description,
  timeToCompleteDays,
  sendInOrder,
  enableOTP,
  allowModifications,
  autoReminder,
  status,
  setFile,
  setFileType,
  setName,
  setEmail,
  setPhone,
  setTitle,
  setNote,
  setDescription,
  setTimeToCompleteDays,
  setSendInOrder,
  setEnableOTP,
  setAllowModifications,
  setAutoReminder,
  onSubmit,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Invalid email format";

    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10,15}$/.test(phone)) newErrors.phone = "Invalid phone number (10-15 digits)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const fileType = selected.name.endsWith(".pdf") ? "pdf" : selected.name.endsWith(".docx") ? "docx" : null;
    if (!fileType) {
      alert("Unsupported file type. Only PDF or DOCX allowed.");
      return;
    }

    setFileType(fileType);
    setFile(selected);
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        <Input type="file" accept=".docx,.pdf" onChange={handleUpload} />

        <div>
          <Input type="text" placeholder="Signer name" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <Input type="email" placeholder="Signer email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <Input type="tel" placeholder="Signer phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <Input type="text" placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <Input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input
          type="number"
          placeholder="Time to complete (days)"
          value={timeToCompleteDays}
          onChange={(e) => setTimeToCompleteDays(Number(e.target.value))}
        />

        <div className="flex items-center justify-between">
          <label>Send in order</label>
          <Switch checked={sendInOrder} onCheckedChange={setSendInOrder} />
        </div>

        <div className="flex items-center justify-between">
          <label>Enable OTP</label>
          <Switch checked={enableOTP} onCheckedChange={setEnableOTP} />
        </div>

        <div className="flex items-center justify-between">
          <label>Allow modifications</label>
          <Switch checked={allowModifications} onCheckedChange={setAllowModifications} />
        </div>

        <div className="flex items-center justify-between">
          <label>Auto reminder</label>
          <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={status === "sending"}>
          {status === "sending" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Send for Signing"
          )}
        </Button>

        {status === "sent" && <Badge variant="default">Document Sent to {email}</Badge>}
        {status === "error" && <Badge variant="destructive">Something went wrong</Badge>}
      </CardContent>
    </Card>
  );
};
