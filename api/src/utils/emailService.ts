import { transporter } from '../config/email';
import path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export interface ReceiptEmailData {
  to: string;
  studentName: string;
  receiptNumber: string;
  amount: number;
  date: string;
  pdfBuffer?: Buffer;
}

export class EmailService {
  private static fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@campus.com';
  private static fromName = process.env.SMTP_FROM_NAME || 'Campus Management System';

  /**
   * Send a generic email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send fee receipt via email
   */
  static async sendReceiptEmail(data: ReceiptEmailData): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { margin: 20px 0; }
          .details p { margin: 10px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fee Payment Receipt</h1>
          </div>
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>Thank you for your payment. Please find the receipt details below:</p>
            <div class="details">
              <p><strong>Student Name:</strong> ${data.studentName}</p>
              <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Amount Paid:</strong> <span class="amount">₹${data.amount.toFixed(2)}</span></p>
            </div>
            <p>A detailed receipt is attached to this email.</p>
            <p>If you have any questions, please contact the school office.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Campus Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = data.pdfBuffer
      ? [
          {
            filename: `Receipt_${data.receiptNumber}.pdf`,
            content: data.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    return this.sendEmail({
      to: data.to,
      subject: `Fee Receipt - ${data.receiptNumber}`,
      html: htmlContent,
      attachments,
    });
  }

  /**
   * Send fee due reminder
   */
  static async sendFeeDueReminder(
    to: string,
    studentName: string,
    dueAmount: number,
    dueDate: string
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .amount { font-size: 24px; font-weight: bold; color: #DC2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fee Due Reminder</h1>
          </div>
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>This is a friendly reminder that the following fees are due for payment:</p>
            <p><strong>Student Name:</strong> ${studentName}</p>
            <p><strong>Due Amount:</strong> <span class="amount">₹${dueAmount.toFixed(2)}</span></p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p>Please make the payment at your earliest convenience to avoid any late fees.</p>
            <p>Thank you for your cooperation.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Fee Due Reminder - ${studentName}`,
      html: htmlContent,
    });
  }

  /**
   * Send monthly report
   */
  static async sendMonthlyReport(
    to: string | string[],
    month: string,
    year: number,
    reportData: any,
    pdfBuffer?: Buffer
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Monthly Report - ${month} ${year}</h1>
          </div>
          <div class="content">
            <p>Dear Administrator,</p>
            <p>Please find attached the monthly income and expenditure report for ${month} ${year}.</p>
            <p><strong>Summary:</strong></p>
            <ul>
              <li>Total Income: ₹${reportData.totalIncome?.toFixed(2) || '0.00'}</li>
              <li>Total Expenses: ₹${reportData.totalExpenses?.toFixed(2) || '0.00'}</li>
              <li>Net Income: ₹${reportData.netIncome?.toFixed(2) || '0.00'}</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = pdfBuffer
      ? [
          {
            filename: `Report_${month}_${year}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    return this.sendEmail({
      to,
      subject: `Monthly Report - ${month} ${year}`,
      html: htmlContent,
      attachments,
    });
  }
}
