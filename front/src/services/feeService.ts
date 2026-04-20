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
  academicYear?: string;
  feeMonth?: string;
}

export interface PaidStudentIdsParams {
  academicYear?: string;
  feeMonth?: string;
  classId?: string;
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
  academicYear?: string;
  feeMonth?: string;
}

export interface CreateBulkFeePaymentData {
  payments: Array<{
    studentId: string;
    feeItems: FeeItemData[];
    remarks?: string;
  }>;
  paymentMethod: 'cash' | 'bank' | 'online';
  remarks?: string;
  academicYear?: string;
  feeMonth?: string;
}

export interface BulkFeePaymentResult {
  payments: FeePayment[];
  count: number;
  totalAmount: number;
}

export interface UpdateFeePaymentData {
  paymentMethod: 'cash' | 'bank' | 'online';
  paymentDate: string;
  remarks?: string;
  academicYear?: string;
  feeMonth?: string;
  reason: string;
}

export interface CancelFeePaymentData {
  reason: string;
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

  createBulkFeePayments: async (paymentData: CreateBulkFeePaymentData) => {
    const response = await apiClient.post<BulkFeePaymentResult>('/fees/bulk', paymentData);
    return response.data;
  },

  updateFeePayment: async (paymentId: string, paymentData: UpdateFeePaymentData) => {
    const response = await apiClient.patch<FeePayment>(`/fees/${paymentId}`, paymentData);
    return response.data;
  },

  cancelFeePayment: async (paymentId: string, data: CancelFeePaymentData) => {
    const response = await apiClient.patch<FeePayment>(`/fees/${paymentId}/cancel`, data);
    return response.data;
  },

  getPaidStudentIds: async (params?: PaidStudentIdsParams) => {
    const response = await apiClient.get<string[]>('/fees/paid-student-ids', params);
    return response.data;
  },

  // Get fee statistics
  getFeeStats: async () => {
    const response = await apiClient.get<FeeStats>('/fees/stats/overview');
    return response.data;
  }
};