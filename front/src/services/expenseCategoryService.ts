import { apiClient } from '@/lib/api';

export interface ExpenseCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseCategoryData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export const expenseCategoryService = {
  // Get all expense categories
  getExpenseCategories: async (params?: ExpenseCategoryQueryParams) => {
    const response = await apiClient.get('/expense-categories', params);
    return response.data;
  },

  // Get expense category by ID
  getExpenseCategory: async (id: string) => {
    const response = await apiClient.get(`/expense-categories/${id}`);
    return response.data;
  },

  // Create expense category
  createExpenseCategory: async (data: CreateExpenseCategoryData) => {
    const response = await apiClient.post('/expense-categories', data);
    return response.data;
  },

  // Update expense category
  updateExpenseCategory: async (id: string, data: Partial<CreateExpenseCategoryData>) => {
    const response = await apiClient.put(`/expense-categories/${id}`, data);
    return response.data;
  },

  // Delete expense category
  deleteExpenseCategory: async (id: string) => {
    const response = await apiClient.delete(`/expense-categories/${id}`);
    return response.data;
  }
};