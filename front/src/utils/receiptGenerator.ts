import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ReceiptData } from '@/types/receipt';

export const generateReceiptPDF = async (receiptData: ReceiptData): Promise<Blob> => {
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
        <h2 style="font-size: 20px; font-weight: 600; color: #333; margin: 0 0 8px 0;">FEE RECEIPT</h2>
        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #666;">
          <span>Receipt No: <strong>${receiptData.receiptNo}</strong></span>
          <span>Date: <strong>${new Date(receiptData.paymentDate).toLocaleDateString()}</strong></span>
        </div>
      </div>

      <!-- Student Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
        <div>
          <h3 style="font-weight: 600; color: #333; margin: 0 0 12px 0;">Student Details</h3>
          <div style="font-size: 14px; line-height: 1.6;">
            <div><span style="color: #666;">Name:</span> <strong>${receiptData.studentName}</strong></div>
            <div><span style="color: #666;">Class:</span> <strong>${receiptData.class}</strong></div>
            <div><span style="color: #666;">Admission No:</span> <strong>${receiptData.admissionNo}</strong></div>
          </div>
        </div>
        <div>
          <h3 style="font-weight: 600; color: #333; margin: 0 0 12px 0;">Payment Details</h3>
          <div style="font-size: 14px; line-height: 1.6;">
            <div><span style="color: #666;">Fee Type:</span> <strong style="text-transform: capitalize;">${receiptData.feeType}</strong></div>
            <div><span style="color: #666;">Payment Method:</span> <strong style="text-transform: capitalize;">${receiptData.paymentMethod}</strong></div>
            <div><span style="color: #666;">Amount:</span> <strong style="color: #16a34a;">₹${receiptData.amount.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      <!-- Amount in Words -->
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #ccc; border-radius: 8px;">
        <div style="font-size: 14px;">
          <span style="color: #666;">Amount in Words:</span>
          <div style="margin-top: 4px; font-weight: 500; color: #333;">
            Rupees ${receiptData.amount.toLocaleString()} Only
          </div>
        </div>
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
          <div style="border-top: 1px solid #666; width: 128px; margin-bottom: 8px;"></div>
          <span style="font-size: 14px; color: #666;">Student Signature</span>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #666; width: 128px; margin-bottom: 8px;"></div>
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

export const downloadReceipt = async (receiptData: ReceiptData) => {
  try {
    const pdfBlob = await generateReceiptPDF(receiptData);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${receiptData.receiptNo}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating receipt:', error);
    throw new Error('Failed to generate receipt');
  }
};