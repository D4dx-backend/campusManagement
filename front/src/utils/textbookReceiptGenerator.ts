import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TextbookIndentReceipt } from '@/types/textbookIndent';

export const generateTextbookReceiptPDF = async (receiptData: TextbookIndentReceipt): Promise<Blob> => {
  // Create a temporary container for the receipt
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = 'white';
  
  // Create the receipt HTML
  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 24px; margin-bottom: 24px;">
        ${receiptData.config.logo ? `<img src="${receiptData.config.logo}" alt="School Logo" style="height: 64px; width: 64px; margin: 0 auto 16px; object-fit: contain;">` : ''}
        <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0 0 8px 0;">${receiptData.config.schoolName}</h1>
        <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0;">${receiptData.config.address}</p>
        <div style="margin-top: 8px; font-size: 14px; color: #666;">
          <span>Phone: ${receiptData.config.phone}</span> | <span>Email: ${receiptData.config.email}</span>
        </div>
        ${receiptData.config.website ? `<p style="font-size: 14px; color: #666; margin: 4px 0 0 0;">Website: ${receiptData.config.website}</p>` : ''}
      </div>

      <!-- Receipt Title -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #333; margin: 0 0 8px 0;">TEXTBOOK ISSUE RECEIPT</h2>
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #666;">
          <span>Indent No: <strong>${receiptData.indentNo}</strong></span>
          <span>Issue Date: <strong>${new Date(receiptData.issueDate).toLocaleDateString()}</strong></span>
        </div>
      </div>

      <!-- Student Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
        <div>
          <h3 style="font-weight: 600; color: #333; margin: 0 0 12px 0;">Student Details</h3>
          <div style="font-size: 14px; line-height: 1.6;">
            <div><span style="color: #666;">Name:</span> <strong>${receiptData.studentName}</strong></div>
            <div><span style="color: #666;">Class:</span> <strong>${receiptData.class}${receiptData.division ? ` - ${receiptData.division}` : ''}</strong></div>
            <div><span style="color: #666;">Admission No:</span> <strong>${receiptData.admissionNo}</strong></div>
          </div>
        </div>
        <div>
          <h3 style="font-weight: 600; color: #333; margin: 0 0 12px 0;">Issue Details</h3>
          <div style="font-size: 14px; line-height: 1.6;">
            <div><span style="color: #666;">Payment Method:</span> <strong style="text-transform: capitalize;">${receiptData.paymentMethod}</strong></div>
            <div><span style="color: #666;">Issued By:</span> <strong>${receiptData.issuedBy}</strong></div>
            ${receiptData.expectedReturnDate ? `<div><span style="color: #666;">Expected Return:</span> <strong>${new Date(receiptData.expectedReturnDate).toLocaleDateString()}</strong></div>` : ''}
          </div>
        </div>
      </div>

      <!-- Textbook Items -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-weight: 600; color: #333; margin: 0 0 12px 0;">Textbook Details</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; border-radius: 8px; overflow: hidden;">
          <thead style="background: #f5f5f5;">
            <tr>
              <th style="padding: 8px; text-align: left; font-size: 14px; font-weight: 500; color: #333; border-bottom: 1px solid #ccc;">Book Code</th>
              <th style="padding: 8px; text-align: left; font-size: 14px; font-weight: 500; color: #333; border-bottom: 1px solid #ccc;">Title</th>
              <th style="padding: 8px; text-align: left; font-size: 14px; font-weight: 500; color: #333; border-bottom: 1px solid #ccc;">Subject</th>
              <th style="padding: 8px; text-align: center; font-size: 14px; font-weight: 500; color: #333; border-bottom: 1px solid #ccc;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 14px; font-weight: 500; color: #333; border-bottom: 1px solid #ccc;">Price</th>
              <th style="padding: 8px; text-align: right; font-size: 14px; font-weight: 500; color: #333; border-bottom: 1px solid #ccc;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${receiptData.items.map((item, index) => `
              <tr style="${index > 0 ? 'border-top: 1px solid #e5e5e5;' : ''}">
                <td style="padding: 8px; font-size: 14px; color: #333;">${item.bookCode}</td>
                <td style="padding: 8px; font-size: 14px; color: #333;">${item.title}</td>
                <td style="padding: 8px; font-size: 14px; color: #333;">${item.subject}</td>
                <td style="padding: 8px; font-size: 14px; color: #333; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; font-size: 14px; color: #333; text-align: right;">₹${item.price.toLocaleString()}</td>
                <td style="padding: 8px; font-size: 14px; color: #333; text-align: right; font-weight: 500;">₹${item.total.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot style="background: #f9f9f9;">
            <tr>
              <td colspan="5" style="padding: 8px; font-size: 14px; font-weight: 500; color: #333; text-align: right; border-top: 1px solid #ccc;">Total Amount:</td>
              <td style="padding: 8px; font-size: 14px; font-weight: bold; color: #333; text-align: right; border-top: 1px solid #ccc;">₹${receiptData.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td colspan="5" style="padding: 8px; font-size: 14px; font-weight: 500; color: #333; text-align: right;">Paid Amount:</td>
              <td style="padding: 8px; font-size: 14px; font-weight: 500; color: #16a34a; text-align: right;">₹${receiptData.paidAmount.toLocaleString()}</td>
            </tr>
            ${receiptData.balanceAmount > 0 ? `
            <tr>
              <td colspan="5" style="padding: 8px; font-size: 14px; font-weight: 500; color: #333; text-align: right;">Balance Amount:</td>
              <td style="padding: 8px; font-size: 14px; font-weight: 500; color: #dc2626; text-align: right;">₹${receiptData.balanceAmount.toLocaleString()}</td>
            </tr>
            ` : ''}
          </tfoot>
        </table>
      </div>

      <!-- Amount in Words -->
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #ccc; border-radius: 8px;">
        <div style="font-size: 14px;">
          <span style="color: #666;">Total Amount in Words:</span>
          <div style="margin-top: 4px; font-weight: 500; color: #333;">
            Rupees ${receiptData.totalAmount.toLocaleString()} Only
          </div>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div style="margin-bottom: 24px; padding: 16px; background: #fefce8; border: 1px solid #fde047; border-radius: 8px;">
        <h4 style="font-weight: 600; color: #333; margin: 0 0 8px 0;">Terms & Conditions:</h4>
        <ul style="font-size: 14px; color: #555; margin: 0; padding-left: 16px; line-height: 1.5;">
          <li>All textbooks must be returned in good condition at the end of the academic year.</li>
          <li>Lost or damaged books will be charged at full replacement cost.</li>
          <li>Students are responsible for the care and maintenance of issued textbooks.</li>
          <li>Late return may result in penalty charges as per school policy.</li>
          ${receiptData.expectedReturnDate ? `<li>Expected return date: <strong>${new Date(receiptData.expectedReturnDate).toLocaleDateString()}</strong></li>` : ''}
        </ul>
      </div>

      ${receiptData.remarks ? `
      <!-- Remarks -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 14px;">
          <span style="color: #666;">Remarks:</span>
          <div style="margin-top: 4px; color: #333;">${receiptData.remarks}</div>
        </div>
      </div>
      ` : ''}

      ${receiptData.config.taxNumber ? `
      <!-- Tax Information -->
      <div style="margin-bottom: 24px; font-size: 14px; color: #666;">
        <div>Tax Number: ${receiptData.config.taxNumber}</div>
        ${receiptData.config.registrationNumber ? `<div>Registration Number: ${receiptData.config.registrationNumber}</div>` : ''}
      </div>
      ` : ''}

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; align-items: end; margin: 48px 0 24px 0;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #666; width: 120px; margin-bottom: 8px;"></div>
          <span style="font-size: 14px; color: #666;">Student Signature</span>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #666; width: 120px; margin-bottom: 8px;"></div>
          <span style="font-size: 14px; color: #666;">Parent/Guardian</span>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #666; width: 120px; margin-bottom: 8px;"></div>
          <span style="font-size: 14px; color: #666;">Authorized Signature</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #ccc; padding-top: 16px;">
        ${receiptData.config.principalName ? `<p style="font-size: 14px; color: #666; margin: 0 0 8px 0;">Principal: ${receiptData.config.principalName}</p>` : ''}
        ${receiptData.config.footerText ? `<p style="font-size: 14px; color: #666; font-style: italic; margin: 0 0 8px 0;">${receiptData.config.footerText}</p>` : ''}
        <p style="font-size: 12px; color: #999; margin: 0;">
          This is a computer generated receipt and does not require signature.
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Return as blob
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

export const downloadTextbookReceipt = async (receiptData: TextbookIndentReceipt) => {
  try {
    const pdfBlob = await generateTextbookReceiptPDF(receiptData);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `textbook-receipt-${receiptData.indentNo}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating textbook receipt:', error);
    throw new Error('Failed to generate textbook receipt');
  }
};