export interface WhatsAppConfig {
  secret: string;
  account: string;
  apiUrl: string;
}

// WhatsApp configuration from environment variables (Dxing API)
const whatsappConfig: WhatsAppConfig = {
  secret: process.env.DXING_secret || process.env.DXING_API_KEY || '',
  account: process.env.DXING_Account || '',
  apiUrl: 'https://app.dxing.in/api/send/whatsapp',
};

// Validate Dxing configuration
export const isWhatsAppConfigured = () => {
  return !!(whatsappConfig.secret && whatsappConfig.account);
};

if (!isWhatsAppConfigured()) {
  console.warn('Dxing WhatsApp credentials not configured. WhatsApp functionality will be disabled.');
}

export const dxingConfig = whatsappConfig;
