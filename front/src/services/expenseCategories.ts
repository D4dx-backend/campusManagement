import api from '@/lib/api';

export interface ExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryResponse {
  success: boolean;
  message: string;
  data: ExpenseCategory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const expenseCategoriesApi = {
  getExpenseCategories: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ExpenseCategoryResponse> => {
    const response = await api.get('/expense-categories', { params });
    return response.data;
  },

  getExpenseCategory: async (id: string): Promise<{ success: boolean; message: string; data: ExpenseCategory }> => {
    const response = await api.get(`/expense-categories/${id}`);
    return response.data;
  },

  createExpenseCategory: async (data: Partial<ExpenseCategory>): Promise<{ success: boolean; message: string; data: ExpenseCategory }> => {
    const response = await api.post('/expense-categories', data);
    return response.data;
  },

  updateExpenseCategory: async (id: string, data: Partial<ExpenseCategory>): Promise<{ success: boolean; message: string; data: ExpenseCategory }> => {
    const response = await api.put(`/expense-categories/${id}`, data);
    return response.data;
  },

  deleteExpenseCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
  }
};