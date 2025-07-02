import React, {
  useState,
  ChangeEvent,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import mammoth from "mammoth";
import { htmlToBase64Pdf } from "@/utils/htmlToBase64Pdf";
import { toast } from "sonner";
import { Button } from "../ui/button";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export type DocxToHtmlViewerRef = {
  getMergedHtml: (formData?: any) => Promise<string>;
  getHtmlContent: () => string | null;
  getBase64: () => Promise<string>;
  getFileType: () => "docx" | "pdf" | null;
};

type Props = {
  setSignatureBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  onSubmit: () => void;
  onClose: () => void;
  showModal: boolean;
  title: string;
};

const PdfViewer = forwardRef<DocxToHtmlViewerRef, Props>(
  ({ setSignatureBoxes, onSubmit, onClose, showModal, title }, ref) => {
    const [fileName, setFileName] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [mergedHtmlPreview, setMergedHtmlPreview] = useState("");
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<"docx" | "pdf" | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const editableRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getHtmlContent: () => htmlContent,
      getFileType: () => fileType,
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
              formData.paymentDate ? new Date(formData.paymentDate).toLocaleDateString("en-US") : ""
            );
        }

        const merged = `
          <div>
            ${filledHtml}
            ${formData ? `<div style="margin-top: 30px; border-top: 1px solid #999; padding-top: 20px;">
                <h3>Lien Release</h3>
                <p><strong>Project Name:</strong> ${formData.projectName || ""}</p>
                <p><strong>Contractor Name:</strong> ${formData.contractorName || ""}</p>
              </div>` : ""}
          </div>
        `;

        setMergedHtmlPreview(merged);

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = merged;
        document.body.appendChild(tempDiv);

        try {
          const base64 = await htmlToBase64Pdf(tempDiv);
          return base64;
        } finally {
          document.body.removeChild(tempDiv);
        }
      },
      getBase64: async () => {
        if (!uploadedFile || !fileType) throw new Error("No file selected.");
        if (fileType === "docx") {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = mergedHtmlPreview || htmlContent;
          document.body.appendChild(tempDiv);
          try {
            const base64 = await htmlToBase64Pdf(tempDiv);
            return base64;
          } finally {
            document.body.removeChild(tempDiv);
          }
        } else if (fileType === "pdf") {
          const arrayBuffer = await uploadedFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "");
          return btoa(binary);
        }
        throw new Error("Unsupported file type.");
      },
    }));

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadedFile(file);
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      setFileType(fileExtension === "pdf" ? "pdf" : fileExtension === "docx" ? "docx" : null);
      setFileName(file.name);

      if (fileExtension === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } else if (fileExtension === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);

        const thumbs: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push(canvas.toDataURL());
        }
        setThumbnails(thumbs);
      } else {
        toast.error("Please upload a valid .docx or .pdf file.");
      }
    };

    useEffect(() => {
      const renderPage = async () => {
        if (!pdfDoc || !canvasRef.current) return;
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
      };
      renderPage();
    }, [pdfDoc, currentPage]);

    const updateAllSignatureBoxStates = () => {
      const boxes = Array.from(document.querySelectorAll(".signature-box"));
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const updated = boxes.map((box: any) => {
        const rect = box.getBoundingClientRect();
        return {
          type: "signature",
          page: currentPage,
          x: (rect.left - canvasRect.left) * scaleX,
          y: (rect.top - canvasRect.top) * scaleY,
          w: rect.width * scaleX,
          h: rect.height * scaleY,
        };
      });

      setSignatureBoxes(updated);
    };


const addSignatureBox = () => {
  const container = pdfContainerRef.current;
  const canvas = canvasRef.current;
  if (!container || !canvas) return;

  const canvasRect = canvas.getBoundingClientRect();
  const box = document.createElement("div");
  box.className = "signature-box";
  box.innerHTML = `Signature <button class='signature-close'>&times;</button>`;

  // Fixed box size in PDF units (assuming scale = 1.5)
  const boxPdfWidth = 150; // pixels in PDF canvas
  const boxPdfHeight = 50;

  // Position the box 20px from bottom-right of canvas
  const left = canvas.width - boxPdfWidth - 20;
  const top = canvas.height - boxPdfHeight - 20;

  // Convert to screen (CSS pixel) coordinates
  const scaleX = canvas.clientWidth / canvas.width;
  const scaleY = canvas.clientHeight / canvas.height;

  box.style.left = `${left * scaleX}px`;
  box.style.top = `${top * scaleY}px`;
  box.style.width = `${boxPdfWidth * scaleX}px`;
  box.style.height = `${boxPdfHeight * scaleY}px`;

  container.appendChild(box);

  // Scroll into view
  box.scrollIntoView({ behavior: "smooth", block: "center" });

  box.querySelector(".signature-close")?.addEventListener("click", () => {
    box.remove();
    updateAllSignatureBoxStates();
  });

  box.addEventListener("mousedown", (e) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    const offsetX = e.offsetX;
    const offsetY = e.offsetY;

    const moveHandler = (eMove: MouseEvent) => {
      const x = eMove.clientX - container.getBoundingClientRect().left - offsetX;
      const y = eMove.clientY - container.getBoundingClientRect().top - offsetY;
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

  updateAllSignatureBoxStates();
};



    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <input type="file" accept=".docx,.pdf" onChange={handleFileUpload} />
        </div>
        {fileName && <p className="text-sm">Uploaded: {fileName}</p>}

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl relative">
              <h2 className="text-lg font-semibold mb-4">Document Preview</h2>

              {pdfDoc && (
                <div className="flex gap-4">
                  <div className="w-28 overflow-y-auto max-h-[500px] border rounded p-2">
                    {thumbnails.map((thumb, index) => (
                      <img
                        key={index}
                        src={thumb}
                        alt={`Page ${index + 1}`}
                        className={`mb-2 border cursor-pointer rounded ${currentPage === index + 1 ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => setCurrentPage(index + 1)}
                      />
                    ))}
                  </div>

                  <div
                    ref={pdfContainerRef}
                    className="relative overflow-auto max-h-[500px] border rounded"
                    style={{ position: "relative" }}
                  >
                    <canvas ref={canvasRef} className="block mx-auto" />
                  </div>

                </div>
              )}

              {!pdfDoc && (
                <div
                  ref={editableRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="border p-4 rounded bg-white overflow-y-auto relative"
                  style={{ minHeight: 300, maxHeight: 400 }}
                  dangerouslySetInnerHTML={{ __html: mergedHtmlPreview || htmlContent }}
                />
              )}

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={addSignatureBox} className="bg-blue-600 hover:bg-blue-700">Add Signature Box</Button>
                <Button onClick={onSubmit} className="bg-construction-600 hover:bg-construction-700">
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
            color: #000;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            cursor: move;
            user-select: none;
            z-index: 10;
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

export default PdfViewer;
