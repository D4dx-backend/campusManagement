import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService, FeeQueryParams, CreateFeePaymentData } from '@/services/feeService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const feeKeys = {
  all: ['fees'] as const,
  lists: () => [...feeKeys.all, 'list'] as const,
  list: (params: FeeQueryParams) => [...feeKeys.lists(), params] as const,
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
        description: error.response?.data?.message || 'Failed to record fee payment',
        variant: 'destructive',
      });
    },
  });
};