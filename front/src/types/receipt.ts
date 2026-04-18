export interface ReceiptConfig {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  principalName?: string;
  taxNumber?: string;
  registrationNumber?: string;
  footerText?: string;
}

export interface ReceiptData {
  receiptNo: string;
  transactionId?: string;
  studentName: string;
  class: string;
  admissionNo: string;
  feeType?: string;
  feeItems?: Array<{ title: string; amount: number }>;
  amount?: number;
  totalAmount?: number;
  paymentMethod: string;
  paymentDate: string;
  remarks?: string;
  config: ReceiptConfig;
}