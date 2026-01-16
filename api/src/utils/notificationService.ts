import nodemailer from 'nodemailer';
import axios from 'axios';

// Gmail configuration with App Password
// To use Gmail:
// 1. Enable 2-Step Verification in Google Account
// 2. Generate App Password: https://myaccount.google.com/apppasswords
// 3. Set SMTP_USER=your-email@gmail.com
// 4. Set SMTP_PASS=your-16-digit-app-password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER, // Gmail address
    pass: process.env.SMTP_PASS  // Gmail App Password (16 characters)
  },
  tls: {
    rejectUnauthorized: false
  }
});

// DXing WhatsApp API Configuration
// API Documentation: https://dxing.in/api-docs
// Get your API key from: https://dxing.in/dashboard
const DXING_API_URL = process.env.DXING_API_URL || 'https://api.dxing.in/v1/send-message';
const DXING_API_KEY = process.env.DXING_API_KEY || '';
const DXING_INSTANCE_ID = process.env.DXING_INSTANCE_ID || '';

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
 * Send fee receipt WhatsApp message via DXing API
 * DXing API Documentation: https://dxing.in/api-docs
 */
export const sendFeeReceiptWhatsApp = async (data: FeeReceiptData): Promise<boolean> => {
  try {
    if (!data.guardianPhone || !DXING_API_URL || !DXING_API_KEY || !DXING_INSTANCE_ID) {
      console.error('WhatsApp configuration missing');
      return false;
    }

    // Format phone number for DXing (10 digits for India, add country code)
    let phone = data.guardianPhone.replace(/[\s\-\+]/g, '');
    
    // If phone is 10 digits, add India country code
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    // Remove leading + if present
    if (phone.startsWith('+')) {
      phone = phone.substring(1);
    }

    const feeItemsList = data.feeItems
      .map(item => `• ${item.title}: ₹${item.amount.toLocaleString()}`)
      .join('\n');

    const message = `✅ *Fee Payment Receipt*

📋 Receipt No: ${data.receiptNo}
👤 Student: ${data.studentName}
🎓 Class: ${data.class}
📅 Date: ${new Date(data.paymentDate).toLocaleDateString('en-IN')}
💳 Method: ${data.paymentMethod.toUpperCase()}

📝 *Fee Details:*
${feeItemsList}

💰 *Total Paid: ₹${data.totalAmount.toLocaleString('en-IN')}*

Thank you for your payment!
- ${data.institutionName || 'Campus Management'}`;

    // DXing API request format
    const response = await axios.post(
      DXING_API_URL,
      {
        instance_id: DXING_INSTANCE_ID,
        number: phone,
        type: 'text',
        message: message
      },
      {
        headers: {
          'Authorization': `Bearer ${DXING_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (response.data.status === 'success' || response.status === 200) {
      return true;
    }

    console.error('DXing API error:', response.data);
    return false;
  } catch (error: any) {
    console.error('WhatsApp sending error:', error.response?.data || error.message);
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

      if (recipient.phone && DXING_API_URL && DXING_API_KEY && DXING_INSTANCE_ID) {
        // Format phone for DXing
        let phone = recipient.phone.replace(/[\s\-\+]/g, '');
        if (phone.length === 10) {
          phone = '91' + phone;
        }

        await axios.post(
          DXING_API_URL,
          { 
            instance_id: DXING_INSTANCE_ID,
            number: phone,
            type: 'text',
            message: `${recipient.name},\n\n${message}\n\n- ${institutionName || 'Campus Management'}` 
          },
          { 
            headers: { 
              'Authorization': `Bearer ${DXING_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
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
