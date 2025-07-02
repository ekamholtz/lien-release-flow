
import jsPDF from 'jspdf';

export async function htmlToBase64Pdf(htmlElement: HTMLElement): Promise<string> {
  const doc = new jsPDF();
  
  // Get the text content from the HTML element
  const textContent = htmlElement.textContent || htmlElement.innerText || '';
  
  // Simple text rendering - for more complex HTML rendering, you might need html2canvas
  const lines = doc.splitTextToSize(textContent, 180); // 180mm width
  
  let yPosition = 20;
  const lineHeight = 7;
  
  lines.forEach((line: string) => {
    if (yPosition > 280) { // Near bottom of page
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += lineHeight;
  });
  
  // Return base64 string without data URL prefix
  return doc.output('datauristring').split(',')[1];
}
