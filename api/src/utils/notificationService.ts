import nodemailer from 'nodemailer';
import axios from 'axios';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// WhatsApp configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || '';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';

interface FeeReceiptData {
  receiptNo: string;
  studentName: string;
  class: string;
  feeItems: Array<{ title: string; amount: number }>;
  totalAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  institutionName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
}

/**
 * Send fee receipt email
 */
export const sendFeeReceiptEmail = async (data: FeeReceiptData): Promise<boolean> => {
  try {
    if (!data.guardianEmail || !process.env.SMTP_USER) {
      return false;
    }

    const feeItemsList = data.feeItems
      .map(item => `<li>${item.title}: ₹${item.amount.toLocaleString()}</li>`)
      .join('');

    const mailOptions = {
      from: `"${data.institutionName || 'Campus Management'}" <${process.env.SMTP_USER}>`,
      to: data.guardianEmail,
      subject: `Fee Receipt - ${data.receiptNo}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .details { margin: 20px 0; }
            .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .fee-items { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .total { background-color: #4CAF50; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #4CAF50; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fee Payment Receipt</h1>
            </div>
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              <p>This is to confirm that we have received the fee payment for <strong>${data.studentName}</strong>.</p>
              
              <div class="details">
                <div class="details-row">
                  <span class="label">Receipt No:</span>
                  <span class="value">${data.receiptNo}</span>
                </div>
                <div class="details-row">
                  <span class="label">Student Name:</span>
                  <span class="value">${data.studentName}</span>
                </div>
                <div class="details-row">
                  <span class="label">Class:</span>
                  <span class="value">${data.class}</span>
                </div>
                <div class="details-row">
                  <span class="label">Payment Date:</span>
                  <span class="value">${new Date(data.paymentDate).toLocaleDateString()}</span>
                </div>
                <div class="details-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${data.paymentMethod.toUpperCase()}</span>
                </div>
              </div>

              <div class="fee-items">
                <h3>Fee Details:</h3>
                <ul>
                  ${feeItemsList}
                </ul>
              </div>

              <div class="total">
                Total Amount Paid: ₹${data.totalAmount.toLocaleString()}
              </div>

              <div class="footer">
                <p>Thank you for your payment!</p>
                <p><strong>${data.institutionName || 'Campus Management System'}</strong></p>
                <p style="font-size: 12px; color: #999;">This is an automatically generated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

/**
 * Send fee receipt WhatsApp message
 */
export const sendFeeReceiptWhatsApp = async (data: FeeReceiptData): Promise<boolean> => {
  try {
    if (!data.guardianPhone || !WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
      return false;
    }

    // Format phone number (remove spaces, dashes, and add country code if needed)
    let phone = data.guardianPhone.replace(/[\s-]/g, '');
    if (!phone.startsWith('+')) {
      phone = '+91' + phone; // Default to India country code
    }

    const feeItemsList = data.feeItems
      .map(item => `• ${item.title}: ₹${item.amount.toLocaleString()}`)
      .join('\n');

    const message = `
✅ *Fee Payment Receipt*

📋 Receipt No: ${data.receiptNo}
👤 Student: ${data.studentName}
🎓 Class: ${data.class}
📅 Date: ${new Date(data.paymentDate).toLocaleDateString()}
💳 Method: ${data.paymentMethod.toUpperCase()}

📝 *Fee Details:*
${feeItemsList}

💰 *Total Paid: ₹${data.totalAmount.toLocaleString()}*

Thank you for your payment!
- ${data.institutionName || 'Campus Management'}
    `.trim();

    // Send via WhatsApp API (adjust based on your provider)
    await axios.post(
      WHATSAPP_API_URL,
      {
        phone,
        message
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return true;
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return false;
  }
};

/**
 * Send payment reminder email
 */
export const sendPaymentReminderEmail = async (
  studentName: string,
  className: string,
  dueAmount: number,
  dueDate: Date,
  guardianEmail: string,
  institutionName?: string
): Promise<boolean> => {
  try {
    if (!guardianEmail || !process.env.SMTP_USER) {
      return false;
    }

    const mailOptions = {
      from: `"${institutionName || 'Campus Management'}" <${process.env.SMTP_USER}>`,
      to: guardianEmail,
      subject: `Fee Payment Reminder - ${studentName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ff9800; color: white; padding: 20px; text-align: center;">
              <h1>Fee Payment Reminder</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
              <p>Dear Parent/Guardian,</p>
              <p>This is a reminder that the fee payment for <strong>${studentName}</strong> (Class: ${className}) is due.</p>
              
              <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #ff9800;">
                <p><strong>Due Amount:</strong> ₹${dueAmount.toLocaleString()}</p>
                <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
              </div>

              <p>Please make the payment at your earliest convenience to avoid any late fees.</p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ff9800;">
                <p><strong>${institutionName || 'Campus Management System'}</strong></p>
                <p style="font-size: 12px; color: #999;">This is an automatically generated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Reminder email error:', error);
    return false;
  }
};

/**
 * Send bulk notifications
 */
export const sendBulkNotifications = async (
  recipients: Array<{ email?: string; phone?: string; name: string }>,
  subject: string,
  message: string,
  institutionName?: string
): Promise<{ emailsSent: number; whatsappSent: number; failed: number }> => {
  const results = { emailsSent: 0, whatsappSent: 0, failed: 0 };

  for (const recipient of recipients) {
    try {
      if (recipient.email) {
        const mailOptions = {
          from: `"${institutionName || 'Campus Management'}" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <p>Dear ${recipient.name},</p>
              <div style="white-space: pre-wrap;">${message}</div>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p><strong>${institutionName || 'Campus Management System'}</strong></p>
              </div>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        results.emailsSent++;
      }

      if (recipient.phone && WHATSAPP_API_URL) {
        let phone = recipient.phone.replace(/[\s-]/g, '');
        if (!phone.startsWith('+')) {
          phone = '+91' + phone;
        }

        await axios.post(
          WHATSAPP_API_URL,
          { phone, message: `${recipient.name},\n\n${message}` },
          { headers: { 'Authorization': `Bearer ${WHATSAPP_API_KEY}` } }
        );
        results.whatsappSent++;
      }
    } catch (error) {
      console.error(`Notification failed for ${recipient.name}:`, error);
      results.failed++;
    }
  }

  return results;
};
