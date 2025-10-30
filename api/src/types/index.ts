import { Request } from 'express';

export type UserRole = 'super_admin' | 'branch_admin' | 'accountant' | 'teacher' | 'staff';

export interface IUser {
  _id: string;
  email: string;
  mobile: string;
  pin: string;
  name: string;
  role: UserRole;
  branchId?: string;
  permissions: IPermission[];
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
  comparePin(pin: string): Promise<boolean>;
}

export interface IBranch {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName?: string;
  establishedDate: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  createdBy: string;
}

export interface IPermission {
  module: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface IStudent {
  _id: string;
  admissionNo: string;
  name: string;
  classId: string;
  class: string;
  section: string;
  dateOfBirth: Date;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  transport: 'school' | 'own' | 'none';
  transportRoute?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export interface IExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIncomeCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDesignation {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaff {
  _id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: Date;
  phone: string;
  email: string;
  address: string;
  salary: number;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export type FeeType = 'tuition' | 'transport' | 'cocurricular' | 'maintenance' | 'exam' | 'textbook';

export interface IFeeStructure {
  _id: string;
  class: string;
  feeType: FeeType;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  academicYear: string;
  branchId: string;
  createdAt: Date;
}

export interface IFeePayment {
  _id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  class: string;
  feeType: FeeType;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank' | 'online';
  status: 'paid' | 'partial' | 'pending';
  remarks?: string;
  branchId: string;
  createdBy: string;
  createdAt: Date;
}

export interface IPayrollEntry {
  _id: string;
  staffId: string;
  staffName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank';
  status: 'paid' | 'pending';
  branchId: string;
  createdAt: Date;
}

export type ExpenseCategory = 'salary' | 'maintenance' | 'utilities' | 'supplies' | 'transport' | 'other';

export interface IExpense {
  _id: string;
  voucherNo: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  approvedBy: string;
  remarks?: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITextBook {
  _id: string;
  bookCode: string;
  title: string;
  subject: string;
  classId: string;
  class: string;
  publisher: string;
  price: number;
  quantity: number;
  available: number;
  academicYear: string;
  branchId: string;
  createdAt: Date;
}

export interface ITextbookIndentItem {
  _id?: string;
  textbookId: string;
  bookCode: string;
  title: string;
  subject: string;
  publisher: string;
  price: number;
  quantity: number;
  returnedQuantity: number;
  status: 'issued' | 'partially_returned' | 'returned' | 'lost' | 'damaged';
  issueDate: Date;
  returnDate?: Date;
  condition?: 'good' | 'fair' | 'poor' | 'damaged' | 'lost';
  remarks?: string;
}

export interface ITextbookIndent {
  _id: string;
  indentNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  division?: string;
  academicYear: string;
  items: ITextbookIndentItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'bank' | 'online' | 'adjustment';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  balanceAmount: number;
  issueDate: Date;
  expectedReturnDate?: Date;
  status: 'pending' | 'issued' | 'partially_returned' | 'returned' | 'cancelled';
  issuedBy: string;
  issuedByName: string;
  remarks?: string;
  receiptGenerated: boolean;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookIssue {
  _id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: Date;
  returnDate?: Date;
  status: 'issued' | 'returned';
  branchId: string;
  createdAt: Date;
}

export interface IClass {
  _id: string;
  name: string;
  description?: string;
  academicYear: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export interface IDivision {
  _id: string;
  classId: string;
  className: string;
  name: string;
  capacity: number;
  classTeacherId?: string;
  classTeacherName?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export interface IExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export interface IIncomeCategory {
  _id: string;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export interface IDepartment {
  _id: string;
  name: string;
  description?: string;
  code: string;
  headOfDepartment?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: Date;
}

export interface IReceiptConfig {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  branchId?: string;
}

// Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query parameters for pagination and filtering
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  // Activity logs
  userId?: string;
  userRole?: string;
  module?: string;
  action?: string;
  // Classes
  academicYear?: string;
  // Divisions
  classId?: string;
  // Expenses
  category?: string;
  paymentMethod?: string;
  // Payroll
  month?: string;
  year?: string;
  // Staff
  department?: string;
  designation?: string;
  // Students
  class?: string;
  section?: string;
  transport?: string;
  // Textbooks
  subject?: string;
  availability?: string;
}