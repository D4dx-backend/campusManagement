# Email & WhatsApp Configuration Guide

## 📧 Gmail Setup (Email Notifications)

### Prerequisites
- A Gmail account
- 2-Step Verification enabled

### Step-by-Step Setup

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the prompts to enable it

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - In "Select app" dropdown, choose "Mail"
   - In "Select device" dropdown, choose "Other (Custom name)"
   - Type "Campus Management System"
   - Click "Generate"
   - You'll see a 16-digit password like: `abcd efgh ijkl mnop`

3. **Configure .env File**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop  # Remove spaces from the 16-digit password
   FROM_EMAIL=your-email@gmail.com
   ```

### Testing Email
Once configured, emails will automatically be sent when:
- Fee payments are recorded
- Payment reminders are triggered
- Bulk notifications are sent

---

## 📱 DXing WhatsApp Setup

### Prerequisites
- Active WhatsApp Business account or WhatsApp number
- DXing account

### Step-by-Step Setup

1. **Create DXing Account**
   - Visit: https://dxing.in
   - Click "Sign Up" or "Register"
   - Complete registration with email and phone
   - Verify your email and phone

2. **Connect WhatsApp**
   - Login to DXing dashboard: https://dxing.in/dashboard
   - Go to "Instances" or "Devices"
   - Click "Add New Instance"
   - Scan QR code with your WhatsApp
   - Wait for connection confirmation

3. **Get API Credentials**
   - In DXing dashboard, go to "API Settings" or "Developer"
   - Copy your **API Key**
   - Copy your **Instance ID** (usually shown on instance details)

4. **Configure .env File**
   ```env
   DXING_API_URL=https://api.dxing.in/v1/send-message
   DXING_API_KEY=your_api_key_here
   DXING_INSTANCE_ID=your_instance_id_here
   ```

### DXing API Details
- **API Documentation**: https://dxing.in/api-docs
- **Dashboard**: https://dxing.in/dashboard
- **Support**: Available through their website

### Message Format
WhatsApp messages will be sent in this format:
```
✅ *Fee Payment Receipt*

📋 Receipt No: REC123456789
👤 Student: John Doe
🎓 Class: 10-A
📅 Date: 16/01/2026
💳 Method: BANK

📝 *Fee Details:*
• Tuition Fee: ₹5,000
• Transport Fee: ₹1,000

💰 *Total Paid: ₹6,000*

Thank you for your payment!
- Your School Name
```

### Testing WhatsApp
Once configured, WhatsApp messages will automatically be sent when:
- Fee payments are recorded
- Payment reminders are triggered
- Bulk notifications are sent

---

## 🔍 Troubleshooting

### Gmail Issues

**Problem: "Username and Password not accepted"**
- Solution: Make sure you're using App Password, not your regular Gmail password
- Ensure 2-Step Verification is enabled

**Problem: "Less secure apps"**
- Solution: With App Password, you don't need to enable "Less secure apps"

**Problem: Emails not sending**
- Check SMTP_USER and SMTP_PASS are correctly set
- Remove all spaces from App Password
- Check internet connection

### DXing WhatsApp Issues

**Problem: "Instance not connected"**
- Solution: Re-scan QR code in DXing dashboard
- Keep your phone online and WhatsApp active

**Problem: "API Key invalid"**
- Solution: Double-check API Key and Instance ID
- Regenerate API Key if needed from dashboard

**Problem: Messages not sending**
- Verify Instance ID is correct
- Check if instance is active in dashboard
- Ensure phone number format is correct (10 digits for India)
- Check API credits/balance in DXing dashboard

---

## 📝 Environment Variables Summary

```env
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=16-digit-app-password
FROM_EMAIL=your-email@gmail.com

# DXing WhatsApp
DXING_API_URL=https://api.dxing.in/v1/send-message
DXING_API_KEY=your_dxing_api_key
DXING_INSTANCE_ID=your_instance_id
```

---

## ✅ Verification

### Test Email Sending
```javascript
// In your API, you can manually test:
import { sendFeeReceiptEmail } from './utils/notificationService';

const testData = {
  receiptNo: 'TEST123',
  studentName: 'Test Student',
  class: '10-A',
  feeItems: [{ title: 'Test Fee', amount: 1000 }],
  totalAmount: 1000,
  paymentDate: new Date(),
  paymentMethod: 'cash',
  guardianEmail: 'test@example.com'
};

sendFeeReceiptEmail(testData).then(success => {
  console.log('Email sent:', success);
});
```

### Test WhatsApp Sending
```javascript
// In your API, you can manually test:
import { sendFeeReceiptWhatsApp } from './utils/notificationService';

const testData = {
  receiptNo: 'TEST123',
  studentName: 'Test Student',
  class: '10-A',
  feeItems: [{ title: 'Test Fee', amount: 1000 }],
  totalAmount: 1000,
  paymentDate: new Date(),
  paymentMethod: 'cash',
  guardianPhone: '9876543210' // 10-digit Indian number
};

sendFeeReceiptWhatsApp(testData).then(success => {
  console.log('WhatsApp sent:', success);
});
```

---

## 🎯 Automatic Notifications

Once configured, notifications are **automatically sent** when:

1. **Fee Payment Recorded** (`/api/fees` POST)
   - Email sent to guardian's email
   - WhatsApp sent to guardian's phone

2. **Payment Reminders**
   - Can be triggered via reports or scheduled tasks

3. **Bulk Notifications**
   - Send to multiple recipients at once
   - Useful for announcements

---

## 💡 Best Practices

1. **Keep credentials secure**: Never commit .env file to git
2. **Monitor usage**: Check DXing dashboard for message limits
3. **Test thoroughly**: Always test in development before production
4. **Backup important data**: Keep logs of sent notifications
5. **Handle failures gracefully**: System continues working even if notifications fail

---

## 📞 Support

- **Gmail Help**: https://support.google.com/accounts
- **DXing Support**: https://dxing.in/support
- **Campus Management System**: Contact your system administrator
