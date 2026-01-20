import { dxingConfig, isWhatsAppConfigured } from '../config/whatsapp';
import axios from 'axios';

export interface WhatsAppMessageOptions {
  to: string;
  message: string;
  priority?: 1 | 2; // 1 = high, 2 = normal
}

export interface DxingResponse {
  status: number;
  message: string;
  data: {
    messageId?: string;
  } | false;
}

export class WhatsAppService {
  /**
   * Format phone number for Dxing (E.164 or local format)
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // If it doesn't start with +, add country code
    if (!cleaned.startsWith('+')) {
      // Remove leading 0 if present
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      // Add country code (default to Bahrain 973)
      const countryCode = process.env.DEFAULT_COUNTRY_CODE || '973';
      cleaned = `${countryCode}${cleaned}`;
    } else {
      // Remove the + sign for Dxing API
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Send a WhatsApp message via Dxing API
   */
  static async sendMessage(options: WhatsAppMessageOptions): Promise<boolean> {
    if (!isWhatsAppConfigured()) {
      console.warn('Dxing WhatsApp not configured. Skipping WhatsApp message.');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(options.to);
      
      const payload = {
        secret: dxingConfig.secret,
        account: dxingConfig.account,
        recipient: formattedNumber,
        type: 'text',
        message: options.message,
        priority: options.priority || 2, // Default to normal priority
      };

      const response = await axios.post<DxingResponse>(dxingConfig.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === 200) {
        return true;
      } else {
        console.error('Dxing API error:', response.data.message);
        return false;
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp message via Dxing:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send fee receipt notification via WhatsApp
   */
  static async sendReceiptNotification(
    to: string,
    studentName: string,
    receiptNumber: string,
    amount: number,
    date: string
  ): Promise<boolean> {
    const message = `*Fee Payment Receipt*

Dear Parent/Guardian,

Your payment has been received successfully.

*Student Name:* ${studentName}
*Receipt Number:* ${receiptNumber}
*Date:* ${date}
*Amount Paid:* ₹${amount.toFixed(2)}

Thank you for your payment.

_This is an automated message from Campus Management System._`;

    return this.sendMessage({ to, message, priority: 1 }); // High priority
  }

  /**
   * Send fee due reminder via WhatsApp
   */
  static async sendFeeDueReminder(
    to: string,
    studentName: string,
    dueAmount: number,
    dueDate: string
  ): Promise<boolean> {
    const message = `*Fee Due Reminder*

Dear Parent/Guardian,

This is a reminder that fees are due for payment.

*Student Name:* ${studentName}
*Due Amount:* ₹${dueAmount.toFixed(2)}
*Due Date:* ${dueDate}

Please make the payment at your earliest convenience.

_This is an automated message from Campus Management System._`;

    return this.sendMessage({ to, message, priority: 2 }); // Normal priority
  }

  /**
   * Send payment confirmation
   */
  static async sendPaymentConfirmation(
    to: string,
    studentName: string,
    amount: number,
    paymentMethod: string
  ): Promise<boolean> {
    const message = `*Payment Confirmation*

Dear Parent/Guardian,

Your payment has been processed successfully.

*Student Name:* ${studentName}
*Amount:* ₹${amount.toFixed(2)}
*Payment Method:* ${paymentMethod}
*Date:* ${new Date().toLocaleDateString('en-IN')}

Thank you!

_This is an automated message from Campus Management System._`;

    return this.sendMessage({ to, message, priority: 1 }); // High priority
  }

  /**
   * Send bulk messages (for announcements)
   */
  static async sendBulkMessages(
    phoneNumbers: string[],
    message: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const phone of phoneNumbers) {
      const result = await this.sendMessage({ to: phone, message, priority: 2 });
      if (result) {
        success++;
      } else {
        failed++;
      }
      // Add a delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return { success, failed };
  }
}
