import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService, PayrollQueryParams, CreatePayrollData } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const payrollKeys = {
  all: ['payroll'] as const,
  lists: () => [...payrollKeys.all, 'list'] as const,
  list: (params: PayrollQueryParams) => [...payrollKeys.lists(), params] as const,
  details: () => [...payrollKeys.all, 'detail'] as const,
  detail: (id: string) => [...payrollKeys.details(), id] as const,
  stats: () => [...payrollKeys.all, 'stats'] as const,
  pending: (month: string, year: number) => [...payrollKeys.all, 'pending', month, year] as const,
};

// Get payroll entries with pagination and filters
export const usePayrollEntries = (params?: PayrollQueryParams) => {
  return useQuery({
    queryKey: payrollKeys.list(params || {}),
    queryFn: () => payrollService.getPayrollEntries(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single payroll entry
export const usePayrollEntry = (id: string) => {
  return useQuery({
    queryKey: payrollKeys.detail(id),
    queryFn: () => payrollService.getPayrollEntry(id),
    enabled: !!id,
  });
};

// Get payroll statistics
export const usePayrollStats = () => {
  return useQuery({
    queryKey: payrollKeys.stats(),
    queryFn: () => payrollService.getPayrollStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get pending payroll
export const usePendingPayroll = (month: string, year: number) => {
  return useQuery({
    queryKey: payrollKeys.pending(month, year),
    queryFn: () => payrollService.getPendingPayroll(month, year),
    enabled: !!month && !!year,
  });
};

// Create payroll entry mutation
export const useCreatePayrollEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePayrollData) => payrollService.createPayrollEntry(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Payroll entry created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create payroll entry',
        variant: 'destructive',
      });
    },
  });
};

// Update payroll entry mutation
export const useUpdatePayrollEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePayrollData> }) =>
      payrollService.updatePayrollEntry(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Payroll entry updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update payroll entry',
        variant: 'destructive',
      });
    },
  });
};

// Delete payroll entry mutation
export const useDeletePayrollEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => payrollService.deletePayrollEntry(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Payroll entry deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete payroll entry',
        variant: 'destructive',
      });
    },
  });
};