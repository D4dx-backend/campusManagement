export interface ReceiptConfig {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  currency?: string;
  currencySymbol?: string;
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
  feeItems?: Array<{ title: string; amount: number; feeType?: string; transportDistanceGroup?: string }>;
  amount?: number;
  totalAmount?: number;
  paymentMethod: string;
  paymentDate: string;
  remarks?: string;
  status?: 'paid' | 'partial' | 'pending' | 'cancelled';
  cancellationReason?: string;
  cancelledAt?: string;
  config: ReceiptConfig;
}