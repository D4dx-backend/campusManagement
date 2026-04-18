import { Request } from 'express';

export type UserRole = 'platform_admin' | 'org_admin' | 'branch_admin' | 'accountant' | 'teacher' | 'staff' | 'student';

export interface IOrganization {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  status: 'active' | 'inactive';
  subscriptionPlan?: string;
  maxBranches?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: string;
  email: string;
  mobile: string;
  pin: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  branchId?: string;
  permissions: IPermission[];
  studentId?: string;
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
  organizationId: string;
  status: 'active' | 'inactive';
  // Override fields (if set, override the org-level defaults)
  logo?: string;
  website?: string;
  taxId?: string;
  taxLabel?: string;
  currency?: string;
  currencySymbol?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  registrationNumber?: string;
  footerText?: string;
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
  dateOfAdmission: Date;
  fatherName: string;
  fatherPhone: string;
  fatherEmail?: string;
  fatherJobCompany?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherJobCompany?: string;
  // legacy guardian fields (kept for backward compatibility)
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  gender: 'male' | 'female';
  address: string;
  transport: 'school' | 'own' | 'none';
  transportRoute?: string;
  status: 'active' | 'inactive' | 'suspended' | 'tc_issued';
  // TC fields
  tcIssued?: boolean;
  tcNumber?: string;
  tcDate?: Date;
  tcReason?: string;
  // Suspension fields
  suspensionDate?: Date;
  suspensionReason?: string;
  suspensionEndDate?: Date;
  isStaffChild?: boolean;
  organizationId: string;
  branchId: string;
  createdAt: Date;
}

export interface IExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIncomeCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransportRoute {
  _id: string;
  routeName: string;
  routeCode: string;
  description?: string;
  classFees: Array<{
    classId: string;
    className: string;
    amount: number;
    staffDiscount: number;
    distanceGroupFees?: Array<{
      groupName: string;
      distanceRange: string;
      amount: number;
    }>;
  }>;
  useDistanceGroups: boolean;
  vehicles: Array<{
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    driverLicenseNo?: string;
    driverHistory?: Array<{
      driverName: string;
      driverPhone: string;
      fromDate: Date;
      toDate: Date;
      reason?: string;
    }>;
  }>;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDesignation {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaff {
  _id: string;
  employeeId: string;
  name: string;
  category: string;
  designation: string;
  department: string;
  dateOfJoining: Date;
  phone: string;
  email: string;
  address: string;
  salary: number;
  salaryHistory: Array<{
    previousSalary: number;
    newSalary: number;
    effectiveDate: Date;
    reason: string;
    incrementedBy?: string;
    createdAt: Date;
  }>;
  status: 'active' | 'inactive' | 'terminated' | 'resigned';
  separationDate?: Date;
  separationReason?: string;
  lastWorkingDate?: Date;
  separationType?: 'terminated' | 'resigned';
  organizationId: string;
  branchId: string;
  createdAt: Date;
}

export interface IFeeTypeConfig {
  _id: string;
  name: string;
  isCommon: boolean;
  isActive: boolean;
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeStructure {
  _id: string;
  title: string;
  feeTypeId: string;
  feeTypeName: string;
  isCommon: boolean;
  class?: string;
  className?: string;
  classId?: string;
  amount: number;
  academicYear: string;
  organizationId: string;
  branchId: string;
  isActive?: boolean;
  staffDiscountPercent?: number;
  transportDistanceGroup?: 'group1' | 'group2' | 'group3' | 'group4';
  distanceRange?: string;
  createdAt: Date;
}

export interface IFeeItem {
  feeStructureId?: string;
  title: string;
  feeType: string;
  amount: number;
  transportDistanceGroup?: 'group1' | 'group2' | 'group3' | 'group4';
}

export interface IFeePayment {
  _id: string;
  receiptNo: string;
  transactionId?: string;
  studentId: string;
  studentName: string;
  class: string;
  classId?: string;
  className?: string;
  feeItems?: IFeeItem[];
  totalAmount?: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank' | 'online';
  status: 'paid' | 'partial' | 'pending';
  remarks?: string;
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
  branchId: string;
  createdAt: Date;
}

export interface IClass {
  _id: string;
  name: string;
  description?: string;
  academicYear: string;
  status: 'active' | 'inactive';
  organizationId: string;
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
  organizationId: string;
  branchId: string;
  createdAt: Date;
}

export interface IExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
}

export interface IIncomeCategory {
  _id: string;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive';
  organizationId: string;
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
  organizationId: string;
  branchId: string;
  createdAt: Date;
}

export interface IReceiptConfig {
  _id: string;
  organizationId: string;
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
  organizationId?: string;
  branchId?: string;
}

export interface IAcademicYear {
  _id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubject {
  _id: string;
  name: string;
  code: string;
  classIds: string[];
  maxMark: number;
  passMark: number;
  isOptional: boolean;
  status: 'active' | 'inactive';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExam {
  _id: string;
  name: string;
  academicYear: string;
  examType: 'term' | 'quarterly' | 'half_yearly' | 'annual' | 'class_test' | 'other';
  startDate?: Date;
  endDate?: Date;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizationId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarkEntry {
  studentId: string;
  studentName: string;
  admissionNo: string;
  mark: number | null;
  grade: string;
  remarks?: string;
}

export interface IMarkSheet {
  _id: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  divisionId?: string;
  divisionName?: string;
  academicYear: string;
  maxMark: number;
  passMark: number;
  examDate?: Date;
  entries: IMarkEntry[];
  isFinalized: boolean;
  organizationId: string;
  branchId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
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
  branchId?: string;
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
  gender?: string;
  // Textbooks
  subject?: string;
  availability?: string;
  // Exams & Marks
  examId?: string;
  subjectId?: string;
  divisionId?: string;
  examType?: string;
}