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
};

type Props = {
  setSignatureBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  onSubmit: () => void;
  onClose: () => void;
  showModal: boolean;
};

const DocxToHtmlViewer = forwardRef<DocxToHtmlViewerRef, Props>(
  ({ setSignatureBoxes, onSubmit, onClose, showModal }, ref) => {
    const [fileName, setFileName] = useState<string>("");
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [mergedHtmlPreview, setMergedHtmlPreview] = useState<string>("");

    const editableRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getMergedHtml: async (formData?) => {
        let baseHtml = htmlContent;
        let filledHtml = baseHtml;

        if (formData) {
          filledHtml = baseHtml
            .replace(/{{\s*projectName\s*}}/g, formData.projectName || "")
            .replace(/{{\s*propertyAddress\s*}}/g, formData.propertyAddress || "")
            .replace(/{{\s*contractorName\s*}}/g, formData.contractorName || "")
            .replace(/{{\s*releaseType\s*}}/g, formData.releaseType || "")
            .replace(/{{\s*paymentAmount\s*}}/g, formData.paymentAmount || "")
            .replace(/{{\s*additionalNotes\s*}}/g, formData.additionalNotes || "")
            .replace(/{{\s*contractorMail\s*}}/g, formData.contractorMail || "")
            .replace(
              /{{\s*paymentDate\s*}}/g,
              formData.paymentDate
                ? new Date(formData.paymentDate).toLocaleDateString("en-US")
                : ""
            );
        }

        const merged = `
      <div>
        ${filledHtml}
        ${formData
            ? `<div style="margin-top: 30px; border-top: 1px solid #999; padding-top: 20px;">
                <h3>Lien Release</h3>
                <p><strong>Project Name:</strong> ${formData.projectName || ""}</p>
                <p><strong>Contractor Name:</strong> ${formData.contractorName || ""}</p>
              </div>`
            : ""
          }
      </div>
    `;

        setMergedHtmlPreview(merged); // show preview

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = merged;
        document.body.appendChild(tempDiv);

        try {
          const base64 = await htmlToBase64Pdf(tempDiv);
          document.body.removeChild(tempDiv);
          return base64;
        } catch (err) {
          document.body.removeChild(tempDiv);
          throw err;
        }
      },
    }));


    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.name.endsWith(".docx")) {
        toast.error("Please upload a valid .docx file.");
        return;
      }

      setFileName(file.name);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } catch (err) {
        toast.error("Failed to convert .docx");
        console.error(err);
      }
    };

    const updateAllSignatureBoxStates = () => {
      const boxes = Array.from(
        editableRef.current?.querySelectorAll(".signature-box") || []
      );
      const updated = boxes.map((el: any) => {
        const style = window.getComputedStyle(el);
        return {
          x: parseInt(style.left),
          y: parseInt(style.top),
          w: parseInt(style.width),
          h: parseInt(style.height),
        };
      });
      setSignatureBoxes(updated);
    };

    const addSignatureBox = () => {
      const box = document.createElement("div");
      box.className = "signature-box";
      box.style.left = "50px";
      box.style.top = "50px";
      box.style.position = "absolute";

      const label = document.createElement("span");
      label.textContent = "Signature";
      box.appendChild(label);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "×";
      closeBtn.className = "signature-close";
      closeBtn.onclick = () => {
        box.remove();
        updateAllSignatureBoxStates();
      };
      box.appendChild(closeBtn);

      let offsetX = 0,
        offsetY = 0;
      box.addEventListener("mousedown", (e) => {
        if ((e.target as HTMLElement).tagName === "BUTTON") return;

        offsetX = e.offsetX;
        offsetY = e.offsetY;

        const moveHandler = (eMove: MouseEvent) => {
          const containerRect = editableRef.current?.getBoundingClientRect();
          if (!containerRect) return;

          const x = eMove.clientX - containerRect.left - offsetX;
          const y = eMove.clientY - containerRect.top - offsetY;

          box.style.left = `${x}px`;
          box.style.top = `${y}px`;

          updateAllSignatureBoxStates();
        };

        const upHandler = () => {
          document.removeEventListener("mousemove", moveHandler);
          document.removeEventListener("mouseup", upHandler);
        };

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
      });

      editableRef.current?.appendChild(box);
      updateAllSignatureBoxStates();
    };

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <input type="file" accept=".docx" onChange={handleFileUpload} />
        </div>
        {fileName && <p className="text-sm">Uploaded: {fileName}</p>}

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
              <h2 className="text-lg font-semibold mb-4">Document Preview</h2>

              <div className="flex justify-end mb-2">
                <button
                  onClick={addSignatureBox}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Add Signature Box
                </button>
              </div>

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
                  Generate Lien Release
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
            color: #000;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
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
