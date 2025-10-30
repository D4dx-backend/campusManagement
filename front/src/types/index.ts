export type UserRole = 'super_admin' | 'branch_admin' | 'accountant' | 'teacher' | 'staff';

export interface User {
  id: string;
  email: string;
  mobile: string;
  pin: string;
  name: string;
  role: UserRole;
  branchId?: string; // null for super_admin, required for others
  permissions: Permission[];
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName?: string;
  establishedDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string; // super admin id
}

export interface Permission {
  module: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface LoginCredentials {
  mobile: string;
  pin: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  transport: 'school' | 'own' | 'none';
  transportRoute?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type FeeType = 'tuition' | 'transport' | 'cocurricular' | 'maintenance' | 'exam' | 'textbook';

export interface FeeStructure {
  id: string;
  class: string;
  feeType: FeeType;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  academicYear: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  class: string;
  feeType: FeeType;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank' | 'online';
  status: 'paid' | 'partial' | 'pending';
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank';
  status: 'paid' | 'pending';
  createdAt: string;
}

export type ExpenseCategory = 'salary' | 'maintenance' | 'utilities' | 'supplies' | 'transport' | 'other';

export interface Expense {
  id: string;
  voucherNo: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  approvedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface TextBook {
  id: string;
  bookCode: string;
  title: string;
  subject: string;
  class: string;
  publisher: string;
  price: number;
  quantity: number;
  available: number;
  academicYear: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned';
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Division {
  id: string;
  classId: string;
  className: string;
  name: string;
  capacity: number;
  classTeacherId?: string;
  classTeacherName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  code: string;
  headOfDepartment?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}
