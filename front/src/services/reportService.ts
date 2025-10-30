import { apiClient } from '@/lib/api';

export interface DashboardReportData {
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  staff: {
    total: number;
    active: number;
    totalSalary: number;
  };
  fees: {
    totalCollection: number;
    monthlyCollection: number;
    yearlyCollection: number;
  };
  expenses: {
    totalExpenses: number;
    monthlyExpenses: number;
    yearlyExpenses: number;
  };
  textbooks: {
    totalBooks: number;
    availableBooks: number;
    totalValue: number;
  };
  recentActivities: Array<{
    userName: string;
    userRole: string;
    module: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
  generatedAt: string;
}

export interface FinancialReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: string;
  };
  income: {
    feeCollection: {
      totalAmount: number;
      totalTransactions: number;
    };
    breakdown?: Array<{
      _id: string;
      totalAmount: number;
      totalTransactions: number;
    }>;
  };
  expenses: {
    generalExpenses: {
      totalAmount: number;
      totalTransactions: number;
    };
    payrollExpenses: {
      totalAmount: number;
      totalTransactions: number;
    };
    breakdown?: Array<{
      _id: string;
      totalAmount: number;
      totalTransactions: number;
    }>;
  };
  generatedAt: string;
}

export interface FinancialReportParams {
  startDate: string;
  endDate: string;
  includeBreakdown?: boolean;
  format?: 'json' | 'csv';
}

export const reportService = {
  // Get dashboard overview report
  getDashboardReport: async () => {
    const response = await apiClient.get<DashboardReportData>('/reports/dashboard');
    return response.data;
  },

  // Get financial report
  getFinancialReport: async (params: FinancialReportParams) => {
    const response = await apiClient.get<FinancialReportData>('/reports/financial', params);
    return response.data;
  },

  // Get student report
  getStudentReport: async () => {
    const response = await apiClient.get('/reports/students');
    return response.data;
  },

  // Get staff report
  getStaffReport: async () => {
    const response = await apiClient.get('/reports/staff');
    return response.data;
  },

  // Get fee collection report
  getFeeReport: async (params: { startDate: string; endDate: string; format?: 'json' | 'csv' }) => {
    const response = await apiClient.get('/reports/fees', params);
    return response.data;
  }
};