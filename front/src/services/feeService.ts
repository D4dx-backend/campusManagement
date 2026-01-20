import { apiClient } from '@/lib/api';
import { FeePayment } from '@/types';

export interface FeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  feeType?: string;
  paymentMethod?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  branchId?: string;
}

export interface FeeStats {
  totalCollection: { total: number; count: number };
  monthlyCollection: { total: number; count: number };
  dailyCollection: { total: number; count: number };
  feeTypeStats: Array<{ _id: string; total: number; count: number }>;
  paymentMethodStats: Array<{ _id: string; total: number; count: number }>;
}

export interface FeeItemData {
  feeStructureId: string;
  title: string;
  feeType: string;
  amount: number;
  transportDistanceGroup?: string;
}

export interface CreateFeePaymentData {
  studentId: string;
  feeItems: FeeItemData[];
  paymentMethod: 'cash' | 'bank' | 'online';
  remarks?: string;
}

export const feeService = {
  // Get all fee payments
  getFeePayments: async (params?: FeeQueryParams) => {
    const response = await apiClient.get<FeePayment[]>('/fees', params);
    return response.data;
  },

  // Create fee payment
  createFeePayment: async (paymentData: CreateFeePaymentData) => {
    const response = await apiClient.post<FeePayment>('/fees', paymentData);
    return response.data;
  },

  // Get fee statistics
  getFeeStats: async () => {
    const response = await apiClient.get<FeeStats>('/fees/stats/overview');
    return response.data;
  }
};