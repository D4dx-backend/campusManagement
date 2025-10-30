import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseCategoryService, ExpenseCategoryQueryParams, CreateExpenseCategoryData } from '@/services/expenseCategoryService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const expenseCategoryKeys = {
  all: ['expenseCategories'] as const,
  lists: () => [...expenseCategoryKeys.all, 'list'] as const,
  list: (params: ExpenseCategoryQueryParams) => [...expenseCategoryKeys.lists(), params] as const,
  details: () => [...expenseCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseCategoryKeys.details(), id] as const,
};

// Get expense categories with pagination and filters
export const useExpenseCategories = (params?: ExpenseCategoryQueryParams) => {
  return useQuery({
    queryKey: expenseCategoryKeys.list(params || {}),
    queryFn: () => expenseCategoryService.getExpenseCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single expense category
export const useExpenseCategory = (id: string) => {
  return useQuery({
    queryKey: expenseCategoryKeys.detail(id),
    queryFn: () => expenseCategoryService.getExpenseCategory(id),
    enabled: !!id,
  });
};

// Create expense category mutation
export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateExpenseCategoryData) => expenseCategoryService.createExpenseCategory(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Expense category created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create expense category',
        variant: 'destructive',
      });
    },
  });
};

// Update expense category mutation
export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseCategoryData> }) =>
      expenseCategoryService.updateExpenseCategory(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Expense category updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update expense category',
        variant: 'destructive',
      });
    },
  });
};

// Delete expense category mutation
export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => expenseCategoryService.deleteExpenseCategory(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Expense category deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete expense category',
        variant: 'destructive',
      });
    },
  });
};