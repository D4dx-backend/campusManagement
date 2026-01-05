import { apiClient } from '@/lib/api';

export interface DayBookQueryParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  transactionType?: 'all' | 'income' | 'expense';
  search?: string;
}

export interface LedgerQueryParams {
  accountType?: 'all' | 'fees' | 'expenses' | 'payroll';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface FeeDetailsQueryParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface BalanceSheetQueryParams {
  asOfDate?: string;
}

export interface AnnualReportQueryParams {
  year?: number;
}

export interface Transaction {
  _id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  studentName?: string;
  className?: string;
  branchName?: string;
  status?: string;
}

export interface DayBookResponse {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
}

export interface LedgerAccount {
  accountName: string;
  accountType: 'income' | 'expense';
  balance: number;
  transactionCount: number;
}

export interface LedgerResponse {
  accounts: LedgerAccount[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  trialBalance: {
    totalDebit: number;
    totalCredit: number;
    difference: number;
  };
}

export interface FeePaymentDetail {
  _id: string;
  receiptNumber: string;
  studentId: {
    _id: string;
    name: string;
    rollNumber: string;
    phoneNumber?: string;
  };
  classId: {
    _id: string;
    name: string;
  };
  divisionId?: {
    _id: string;
    name: string;
  };
  branchId: {
    _id: string;
    name: string;
  };
  paymentDate: string;
  tuitionFee: number;
  transportFee: number;
  cocurricularFee: number;
  maintenanceFee: number;
  examFee: number;
  textbookFee: number;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  status: string;
}

export interface FeeDetailsResponse {
  feePayments: FeePaymentDetail[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  breakdown: {
    totalTuitionFee: number;
    totalTransportFee: number;
    totalCocurricularFee: number;
    totalMaintenanceFee: number;
    totalExamFee: number;
    totalTextbookFee: number;
    totalPaid: number;
    paidCount: number;
    pendingCount: number;
    partialCount: number;
  };
  paymentMethodBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface BalanceSheetResponse {
  asOfDate: string;
  assets: {
    cashAndBank: number;
    accountsReceivable: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    totalLiabilities: number;
  };
  equity: {
    retainedEarnings: number;
    totalEquity: number;
  };
  totalAssetsAndEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface MonthlySummary {
  month: string;
  monthNumber: number;
  year: number;
  income: number;
  expenses: number;
  netProfit: number;
}

export interface ExpenseCategory {
  _id: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
}

export interface AnnualReportResponse {
  fiscalYear: string;
  startDate: string;
  endDate: string;
  monthlySummary: MonthlySummary[];
  expenseByCategory: ExpenseCategory[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: string;
  };
}

export const accountingService = {
  // Get day book entries
  getDayBook: async (params?: DayBookQueryParams) => {
    const response = await apiClient.get<DayBookResponse>('/accounting/daybook', params);
    return response.data;
  },

  // Get ledger accounts
  getLedger: async (params?: LedgerQueryParams) => {
    const response = await apiClient.get<LedgerResponse>('/accounting/ledger', params);
    return response.data;
  },

  // Get fee details
  getFeeDetails: async (params?: FeeDetailsQueryParams) => {
    const response = await apiClient.get<FeeDetailsResponse>('/accounting/fee-details', params);
    return response.data;
  },

  // Get balance sheet
  getBalanceSheet: async (params?: BalanceSheetQueryParams) => {
    const response = await apiClient.get<BalanceSheetResponse>('/accounting/balance-sheet', params);
    return response.data;
  },

  // Get annual report
  getAnnualReport: async (params?: AnnualReportQueryParams) => {
    const response = await apiClient.get<AnnualReportResponse>('/accounting/annual-report', params);
    return response.data;
  },
};
