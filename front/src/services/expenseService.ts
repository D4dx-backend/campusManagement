import { apiClient } from '@/lib/api';

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string; // Dynamic categories from database
  paymentMethod?: 'cash' | 'bank';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseStats {
  totalExpenses: {
    total: number;
    count: number;
  };
  monthlyExpenses: {
    total: number;
    count: number;
  };
  yearlyExpenses: {
    total: number;
    count: number;
  };
  categoryStats: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  paymentMethodStats: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    _id: {
      year: number;
      month: number;
    };
    total: number;
    count: number;
  }>;
}

export interface CreateExpenseData {
  date: string;
  category: string; // Dynamic categories from database
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  approvedBy?: string;
  remarks?: string;
}

export const expenseService = {
  // Get all expenses
  getExpenses: async (params?: ExpenseQueryParams) => {
    const response = await apiClient.get('/expenses', params);
    return response.data;
  },

  // Get expense by ID
  getExpense: async (id: string) => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  // Create expense
  createExpense: async (data: CreateExpenseData) => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  // Update expense
  updateExpense: async (id: string, data: Partial<CreateExpenseData>) => {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (id: string) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },

  // Get expense statistics
  getExpenseStats: async () => {
    const response = await apiClient.get<ExpenseStats>('/expenses/stats/overview');
    return response.data;
  }
};