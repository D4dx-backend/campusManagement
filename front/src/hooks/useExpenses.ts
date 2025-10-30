import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService, ExpenseQueryParams, CreateExpenseData } from '@/services/expenseService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params: ExpenseQueryParams) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  stats: () => [...expenseKeys.all, 'stats'] as const,
};

// Get expenses with pagination and filters
export const useExpenses = (params?: ExpenseQueryParams) => {
  return useQuery({
    queryKey: expenseKeys.list(params || {}),
    queryFn: () => expenseService.getExpenses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single expense
export const useExpense = (id: string) => {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.getExpense(id),
    enabled: !!id,
  });
};

// Get expense statistics
export const useExpenseStats = () => {
  return useQuery({
    queryKey: expenseKeys.stats(),
    queryFn: () => expenseService.getExpenseStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create expense mutation
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateExpenseData) => expenseService.createExpense(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Expense created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create expense',
        variant: 'destructive',
      });
    },
  });
};

// Update expense mutation
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseData> }) =>
      expenseService.updateExpense(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Expense updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update expense',
        variant: 'destructive',
      });
    },
  });
};

// Delete expense mutation
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Expense deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete expense',
        variant: 'destructive',
      });
    },
  });
};