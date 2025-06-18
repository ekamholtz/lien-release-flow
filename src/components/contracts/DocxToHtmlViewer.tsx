import React, {
  useState,
  ChangeEvent,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import mammoth from "mammoth";
import { Eye } from "lucide-react";
import { htmlToBase64Pdf } from "@/utils/htmlToBase64Pdf";
import { toast } from "sonner";

export type DocxToHtmlViewerRef = {
  getMergedHtml: (formData: any) => Promise<string>;
};

const DocxToHtmlViewer = forwardRef<DocxToHtmlViewerRef>((_, ref) => {
  const [fileName, setFileName] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  const editableRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getMergedHtml: async (formData) => {
      let editableHtml = editableRef.current?.innerHTML || htmlContent || "";

      editableHtml = editableHtml
        .replace(/{{\s*projectName\s*}}/g, formData.projectName)
        .replace(/{{\s*propertyAddress\s*}}/g, formData.propertyAddress)
        .replace(/{{\s*contractorName\s*}}/g, formData.contractorName)
        .replace(/{{\s*releaseType\s*}}/g, formData.releaseType)
        .replace(/{{\s*paymentAmount\s*}}/g, formData.paymentAmount)
        .replace(/{{\s*additionalNotes\s*}}/g, formData.additionalNotes || "")
        .replace(/{{\s*contractorMail\s*}}/g, formData.contractorMail)
        .replace(/{{\s*paymentDate\s*}}/g, new Date(formData.paymentDate).toLocaleDateString("en-US"));


      const merged = `
      <div>
        ${editableHtml}
        <div style="margin-top: 30px; border-top: 1px solid #999; padding-top: 20px;">
          <h3>Lien Release</h3>
          <p><strong>Project Name:</strong> ${formData.projectName}</p>
          <p><strong>Contractor Name:</strong> ${formData.contractorName}</p>
        </div>
      </div>
    `;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = merged;
      document.body.appendChild(tempDiv);
      console.log("merged html", tempDiv);

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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <input type="file" accept=".docx" onChange={handleFileUpload} />
        <button
          type="button"
          onClick={() => {
            if (!htmlContent) {
              toast.error("Please upload a .docx file first.");
              return;
            }
            setShowModal(true);
          }}
          className="ml-4 text-blue-600 hover:underline flex items-center gap-1"
        >
          <Eye size={18} />
          Preview
        </button>
      </div>
      {fileName && <p className="text-sm">Uploaded: {fileName}</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
            <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              className="border p-4 rounded bg-white overflow-y-auto"
              style={{ minHeight: 300, maxHeight: 400 }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DocxToHtmlViewer;
