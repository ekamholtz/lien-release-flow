import html2pdf from "html2pdf.js";

/**
 * Converts an HTML element to a Base64-encoded PDF.
 * @param element - The HTML element to convert (e.g. a div).
 * @returns A Promise resolving to a base64-encoded string (without data URI prefix).
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
        // Strip the prefix: "data:application/pdf;base64,"
        const base64 = dataUri.split(",")[1];
        resolve(base64);
      })
      .catch((err: any) => {
        console.error("Failed to convert HTML to base64 PDF:", err);
        reject(err);
      });
  });
};
