export interface TextbookIndent {
  _id: string;
  indentNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  division?: string;
  academicYear: string;
  items: TextbookIndentItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'bank' | 'online' | 'adjustment';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  balanceAmount: number;
  issueDate: string;
  expectedReturnDate?: string;
  status: 'pending' | 'issued' | 'partially_returned' | 'returned' | 'cancelled';
  issuedBy: string;
  issuedByName: string;
  remarks?: string;
  receiptGenerated: boolean;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextbookIndentItem {
  _id: string;
  textbookId: string;
  bookCode: string;
  title: string;
  subject: string;
  publisher: string;
  price: number;
  quantity: number;
  returnedQuantity: number;
  status: 'issued' | 'partially_returned' | 'returned' | 'lost' | 'damaged';
  issueDate: string;
  returnDate?: string;
  condition?: 'good' | 'fair' | 'poor' | 'damaged' | 'lost';
  remarks?: string;
}

export interface CreateTextbookIndentData {
  studentId: string;
  items: {
    textbookId: string;
    quantity: number;
  }[];
  paymentMethod: 'cash' | 'bank' | 'online' | 'adjustment';
  paidAmount?: number;
  expectedReturnDate?: string;
  remarks?: string;
}

export interface UpdateTextbookIndentData {
  paymentMethod?: 'cash' | 'bank' | 'online' | 'adjustment';
  paidAmount?: number;
  expectedReturnDate?: string;
  remarks?: string;
  status?: 'pending' | 'issued' | 'partially_returned' | 'returned' | 'cancelled';
}

export interface ReturnTextbookData {
  items: {
    itemId: string;
    returnedQuantity: number;
    condition: 'good' | 'fair' | 'poor' | 'damaged' | 'lost';
    remarks?: string;
  }[];
}

export interface TextbookIndentStats {
  totalIndents: number;
  pendingIndents: number;
  issuedIndents: number;
  returnedIndents: number;
  overdueIndents: number;
  totalValue: number;
  pendingPayments: number;
  monthlyStats: Array<{
    month: string;
    indents: number;
    value: number;
  }>;
  classStats: Array<{
    class: string;
    indents: number;
    value: number;
  }>;
}

export interface TextbookIndentReceipt {
  indentNo: string;
  studentName: string;
  admissionNo: string;
  class: string;
  division?: string;
  items: Array<{
    title: string;
    bookCode: string;
    subject: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  issueDate: string;
  expectedReturnDate?: string;
  issuedBy: string;
  remarks?: string;
  config: any; // Receipt config from existing system
}