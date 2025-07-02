import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import mammoth from "mammoth";
import { AppLayout } from "@/components/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BlankField = {
  index: number;
  label: string;
  key: string;
};

const DocxFillPage = () => {
  const location = useLocation();
  const file = location.state?.file as File | null;
  const prefillData = location.state?.formData || {};

  const [docText, setDocText] = useState("");
  const [blanks, setBlanks] = useState<BlankField[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [filledText, setFilledText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const fieldOptions = [
    { key: "projectName", label: "Project Name" },
    { key: "propertyAddress", label: "Property Address" },
    { key: "contractorName", label: "Contractor Name" },
    { key: "releaseType", label: "Release Type" },
    { key: "paymentAmount", label: "Payment Amount" },
    { key: "additionalNotes", label: "Additional Notes" },
    { key: "contractorMail", label: "Contractor Email" },
    { key: "paymentDate", label: "Payment Date" },
  ];

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    setDocText(text);

    const detected = [...text.matchAll(/_{4,}/g)].map((match, i) => {
      const index = match.index ?? 0;
      const prefix = text.slice(Math.max(0, index - 30), index);
      const label = prefix.split(/\s+/).slice(-3).join(" ") || `Field ${i + 1}`;
      return {
        index,
        label: label.replace(/[^a-zA-Z0-9 ]/g, ""),
        key: `field_${i + 1}`,
      };
    });

    const defaultMap: Record<string, string> = {};
    const data: Record<string, string> = { ...prefillData };

    detected.forEach((b) => {
      const lower = b.label.toLowerCase();
      if (lower.includes("project")) defaultMap[b.key] = "projectName";
      else if (lower.includes("contractor")) defaultMap[b.key] = "contractorName";
      else if (lower.includes("amount")) defaultMap[b.key] = "paymentAmount";
      else if (lower.includes("email")) defaultMap[b.key] = "contractorMail";
      else if (lower.includes("address")) defaultMap[b.key] = "propertyAddress";
      else if (lower.includes("date")) defaultMap[b.key] = "paymentDate";
    });

    fieldOptions.forEach(({ key }) => {
      if (!data[key]) data[key] = "";
    });

    setFormData(data);
    setBlanks(detected);
    setFieldMapping(defaultMap);
    setFilledText("");
  };

  const handleMapChange = (blankKey: string, selectedKey: string) => {
    setFieldMapping((prev) => ({ ...prev, [blankKey]: selectedKey }));
  };

  const handleCustomValueChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFill = () => {
    let index = 0;
    const filled = docText.replace(/_{4,}/g, () => {
      const b = blanks[index++];
      const selectedKey = fieldMapping[b.key];
      const input =
        (selectedKey && (formData[selectedKey] || prefillData[selectedKey])) ||
        "[Missing]";
      return input;
    });
    setFilledText(filled);
    setShowPreview(true);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Fill Lien Release Template</h1>

        {!file && (
          <div className="text-red-600 mb-4">
            No file uploaded. Please go back and upload a .docx file.
          </div>
        )}

        {blanks.length > 0 && (
          <div className="space-y-4">
            {blanks.map((b) => (
              <div key={b.key} className="flex gap-4 items-center">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">
                    {b.label}
                  </label>
                  <Select
                    value={fieldMapping[b.key] || ""}
                    onValueChange={(value) => handleMapChange(b.key, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">
                    {fieldMapping[b.key]
                      ? `Value for ${fieldMapping[b.key]}`
                      : "Custom Value"}
                  </label>
                  <Input
                    value={
                      formData[fieldMapping[b.key]] ||
                      prefillData[fieldMapping[b.key]] ||
                      ""
                    }
                    onChange={(e) =>
                      handleCustomValueChange(fieldMapping[b.key], e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            <Button onClick={handleFill} className="mt-4">
              Preview Filled Template
            </Button>
          </div>
        )}

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Preview</DialogTitle>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-sm p-2 max-h-[70vh] overflow-auto">
              {filledText}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DocxFillPage;
