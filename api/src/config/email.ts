import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email configuration from environment variables
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create reusable transporter
export const createEmailTransporter = () => {
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

export const transporter = createEmailTransporter();
