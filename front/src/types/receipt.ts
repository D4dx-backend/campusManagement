export interface ReceiptConfig {
  _id: string;
  branchId: string;
  branchName: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptConfigData {
  branchId?: string; // Required for API but handled automatically
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  taxNumber?: string;
  registrationNumber?: string;
  footerText?: string;
  isActive: boolean;
}

export interface UpdateReceiptConfigData extends Partial<CreateReceiptConfigData> {}

export interface ReceiptData {
  receiptNo: string;
  studentName: string;
  class: string;
  admissionNo: string;
  feeType: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  remarks?: string;
  config: ReceiptConfig;
}