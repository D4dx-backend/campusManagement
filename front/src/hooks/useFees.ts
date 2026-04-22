import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService, FeeQueryParams, CreateBulkFeePaymentData, CreateFeePaymentData, PaidStudentIdsParams, UpdateFeePaymentData, CancelFeePaymentData } from '@/services/feeService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const feeKeys = {
  all: ['fees'] as const,
  lists: () => [...feeKeys.all, 'list'] as const,
  list: (params: FeeQueryParams) => [...feeKeys.lists(), params] as const,
  paidStudents: (params: PaidStudentIdsParams) => [...feeKeys.all, 'paid-students', params] as const,
  stats: () => [...feeKeys.all, 'stats'] as const,
};

// Get fee payments with pagination and filters
export const useFeePayments = (params?: FeeQueryParams) => {
  return useQuery({
    queryKey: feeKeys.list(params || {}),
    queryFn: () => feeService.getFeePayments(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get fee statistics
export const useFeeStats = () => {
  return useQuery({
    queryKey: feeKeys.stats(),
    queryFn: () => feeService.getFeeStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePaidStudentIds = (params?: PaidStudentIdsParams) => {
  return useQuery({
    queryKey: feeKeys.paidStudents(params || {}),
    queryFn: () => feeService.getPaidStudentIds(params),
    staleTime: 60 * 1000,
  });
};

// Create fee payment mutation
export const useCreateFeePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateFeePaymentData) => feeService.createFeePayment(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: feeKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Fee payment recorded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while recording the fee payment. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Create bulk fee payment mutation
export const useCreateBulkFeePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateBulkFeePaymentData) => feeService.createBulkFeePayments(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: feeKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Fee payments recorded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while recording fee payments. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateFeePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: UpdateFeePaymentData }) => feeService.updateFeePayment(paymentId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: feeKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Fee payment updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while updating the fee payment. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useCancelFeePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: CancelFeePaymentData }) => feeService.cancelFeePayment(paymentId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: feeKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Fee payment cancelled successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while cancelling the fee payment. Please try again.',
        variant: 'destructive',
      });
    },
  });
};