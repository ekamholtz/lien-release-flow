import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Assuming you're using a Switch component

type Props = {
  file: File | null;
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
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type === "application/pdf") setFile(selected);
  };

  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        {/* <h2 className="text-2xl font-bold text-primary">Documents</h2> */}
        <Input type="file" accept="application/pdf" onChange={handleUpload} />
        <Input
          type="text"
          placeholder="Signer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Signer email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="tel"
          placeholder="Signer phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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

        <Button
          className="w-full"
          onClick={onSubmit}
          disabled={status === "sending" || !file || !email || !name}
        >
          {status === "sending" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Send for Signing"
          )}
        </Button>

        {status === "sent" && (
          <Badge variant="default">Document Sent to {email}</Badge>
        )}
        {status === "error" && (
          <Badge variant="destructive">Something went wrong</Badge>
        )}
      </CardContent>
    </Card>
  );
};
