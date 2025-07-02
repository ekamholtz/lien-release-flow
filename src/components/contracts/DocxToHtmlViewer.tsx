import React, {
  useState,
  ChangeEvent,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import mammoth from "mammoth";
import { htmlToBase64Pdf } from "@/utils/htmlToBase64Pdf";
import { toast } from "sonner";
import { Button } from "../ui/button";

export type DocxToHtmlViewerRef = {
  getMergedHtml: (formData?: any) => Promise<string>;
  getHtmlContent: () => string | null;
};

type Props = {
  onSubmit: () => void;
  onClose: () => void;
  showModal: boolean;
  title: string;
  setFileType: (type: "pdf" | "docx") => void;
};

const DocxToHtmlViewer = forwardRef<DocxToHtmlViewerRef, Props>(
  ({ onSubmit, onClose, showModal, title, setFileType }, ref) => {
    const [fileName, setFileName] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [mergedHtmlPreview, setMergedHtmlPreview] = useState("");

    const editableRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getHtmlContent: () => htmlContent,
      getMergedHtml: async (formData?: any) => {
        let filledHtml = htmlContent;

        if (formData) {
          const replacements: Record<string, (d: any) => string> = {
            "project name": d => d.projectName,
            "property address": d => d.propertyAddress,
            "contractor name": d => d.contractorName,
            "vendor/contractor/subcontractor": d => d.contractorName,
            "release type": d => d.releaseType,
            "payment amount": d => d.paymentAmount,
            "notes": d => d.additionalNotes,
            "email": d => d.contractorMail,
            "contractor mail": d => d.contractorMail,
            "date": d =>
              d.paymentDate
                ? new Date(d.paymentDate).toLocaleDateString("en-US")
                : "",
            "payment date": d =>
              d.paymentDate
                ? new Date(d.paymentDate).toLocaleDateString("en-US")
                : "",
            "cutoff date for covered work": d =>
              d.cutoffDate
                ? new Date(d.cutoffDate).toLocaleDateString("en-US")
                : "",
          };

          filledHtml = filledHtml.replace(
            /_{4,}\s*\[([^\]]+)\]/g,
            (match, label) => {
              const labelKey = label.trim().toLowerCase();
              for (const key in replacements) {
                if (labelKey.includes(key)) {
                  return replacements[key](formData) ?? "";
                }
              }
              return match;
            }
          );

          filledHtml = filledHtml.replace(
            /\$\s*_{4,}/g,
            () => {
              const value = formData?.paymentAmount;
              return value ? `$${value}` : "$";
            }
          );

          const wordContextRegex =
            /((?:\b[\w/]+\b[\s\r\n:,$-]*){0,5})_{4,}((?:[\s\r\n:,$-]*\b[\w/]+\b){0,5})/g;

          filledHtml = filledHtml.replace(
            wordContextRegex,
            (match, before = "", after = "") => {
              const context = (
                [
                  ...before.trim().split(/\s+/).slice(-5),
                  ...after.trim().split(/\s+/).slice(0, 5),
                ]
                  .join(" ")
                  .toLowerCase()
                  .replace(/[^a-z0-9\s/]/gi, "")
              );

              for (const key in replacements) {
                if (context.includes(key)) {
                  return `${before}${replacements[key](formData) ?? ""}${after}`;
                }
              }

              return match;
            }
          );
        }

        setMergedHtmlPreview(filledHtml);

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = filledHtml;
        document.body.appendChild(tempDiv);

        try {
          const base64 = await htmlToBase64Pdf(tempDiv);
          return base64;
        } finally {
          document.body.removeChild(tempDiv);
        }
      }

    }));

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const extension = file.name.split(".").pop()?.toLowerCase();
      setFileName(file.name);

      if (extension === "docx") {
        setFileType("docx");
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
          setMergedHtmlPreview("");
        } catch (err) {
          toast.error("Failed to convert .docx file.");
        }
      } else if (extension === "pdf") {
        setFileType("pdf");
        toast("PDF support coming soon.");
      } else {
        toast.error("Unsupported file format. Please upload a .docx or .pdf file.");
      }
    };

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <input type="file" accept=".docx" onChange={handleFileUpload} />
        </div>

        {fileName && <p className="text-sm text-gray-600">Uploaded: {fileName}</p>}

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
              <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
              <div
                ref={editableRef}
                contentEditable
                suppressContentEditableWarning
                className="border p-4 rounded bg-white overflow-y-auto relative"
                style={{ minHeight: 300, maxHeight: 400 }}
                dangerouslySetInnerHTML={{
                  __html: mergedHtmlPreview || htmlContent,
                }}
              />

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={onSubmit}
                  className="bg-construction-600 hover:bg-construction-700"
                >
                  {title === "contract" ? "Send for Signing" : "Generate Lien Release"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .signature-box {
            position: absolute;
            width: 150px;
            height: 50px;
            background-color: rgba(0, 119, 255, 0.2);
            border: 2px dashed #0077ff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            font-weight: bold;
            color: #000;
            cursor: move;
            user-select: none;
          }

          .signature-close {
            background: none;
            border: none;
            font-size: 16px;
            font-weight: bold;
            color: #ff0000;
            cursor: pointer;
            margin-left: 8px;
          }
        `}</style>
      </div>
    );
  }
);

export default DocxToHtmlViewer;
