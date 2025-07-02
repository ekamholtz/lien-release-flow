
import html2pdf from "html2pdf.js";

/**
 * Converts an HTML element to a Base64-encoded PDF.
 * @param element - The HTML element to convert (e.g. a div).
 * @returns A Promise resolving to a base64-encoded string (without data URI prefix).
 */
export const htmlToBase64Pdf = async (element: HTMLElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      margin: [15, 15, 15, 15], // Top, Right, Bottom, Left margins in mm
      filename: "invoice.pdf",
      image: { 
        type: "jpeg", 
        quality: 0.95 
      },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait",
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'] 
      }
    };

    console.log('Starting PDF conversion with options:', options);
    console.log('Element to convert:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      hasContent: element.innerHTML.length > 0
    });

    html2pdf()
      .set(options)
      .from(element)
      .outputPdf("datauristring")
      .then((dataUri: string) => {
        console.log('PDF conversion successful, dataUri length:', dataUri.length);
        // Strip the prefix: "data:application/pdf;base64,"
        const base64 = dataUri.split(",")[1];
        if (!base64 || base64.length === 0) {
          console.error('PDF conversion resulted in empty base64 string');
          reject(new Error('PDF conversion resulted in empty content'));
        } else {
          console.log('Base64 PDF extracted, length:', base64.length);
          resolve(base64);
        }
      })
      .catch((err: any) => {
        console.error("Failed to convert HTML to base64 PDF:", err);
        reject(err);
      });
  });
};
