import html2pdf from "html2pdf.js";
import mammoth from "mammoth";

/**
 * Converts an HTML element to a Base64-encoded PDF string.
 * - Works best with A4-friendly layouts.
 *
 * @param element - The HTML element to convert (e.g., a div)
 * @returns A Promise that resolves to a base64-encoded PDF (no prefix)
 */
export const htmlToBase64Pdf = async (element: HTMLElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    html2pdf()
      .set({
        margin: 10,
        filename: "document.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .outputPdf("datauristring")
      .then((dataUri: string) => {
        const base64 = dataUri.split(",")[1]; // remove data prefix
        resolve(base64);
      })
      .catch((err: any) => {
        console.error("Failed to convert HTML to base64 PDF:", err);
        reject(err);
      });
  });
};

export async function htmlToBase64PdfString(html: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) {
      reject(new Error("Failed to create iframe document"));
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const element = iframe;

    html2pdf()
      .from(element)
      .outputPdf('datauristring')
      .then((pdfBase64: string) => {
        document.body.removeChild(iframe);
        const base64Data = pdfBase64.split(',')[1];
        resolve(base64Data);
      })
      .catch((err: any) => {
        document.body.removeChild(iframe);
        reject(err);
      });
  });
}

/**
 * Converts a File (PDF) to base64.
 * @param file - The uploaded PDF file.
 * @returns Base64-encoded string.
 */
export const pdfFileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "");
  return btoa(binary);
};

export async function convertDocxToHtml(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}