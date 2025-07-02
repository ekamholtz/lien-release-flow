
import html2pdf from "html2pdf.js";

/**
 * Converts an HTML element to a Base64-encoded PDF.
 * @param element - The HTML element to convert (e.g. a div).
 * @returns A Promise resolving to a base64-encoded string (without data URI prefix).
 */
export const htmlToBase64Pdf = async (element: HTMLElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      margin: [10, 10, 10, 10],
      filename: "invoice.pdf",
      image: { 
        type: "jpeg", 
        quality: 1.0
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait"
      }
    };

    console.log('PDF Generation Debug:');
    console.log('Element dimensions:', {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight
    });

    // Ensure element is visible and has content
    if (!element.innerHTML || element.innerHTML.trim().length === 0) {
      console.error('Element has no content');
      reject(new Error('Element has no content to convert'));
      return;
    }

    html2pdf()
      .set(options)
      .from(element)
      .outputPdf("datauristring")
      .then((dataUri: string) => {
        console.log('PDF conversion complete. DataURI length:', dataUri.length);
        
        if (!dataUri || dataUri.length < 100) {
          console.error('Generated PDF appears to be empty or invalid');
          reject(new Error('Generated PDF is empty or invalid'));
          return;
        }

        const base64 = dataUri.split(",")[1];
        if (!base64 || base64.length === 0) {
          console.error('Failed to extract base64 from data URI');
          reject(new Error('Failed to extract base64 from PDF'));
        } else {
          console.log('Base64 PDF extracted successfully, length:', base64.length);
          resolve(base64);
        }
      })
      .catch((err: any) => {
        console.error("PDF conversion failed:", err);
        reject(err);
      });
  });
};
