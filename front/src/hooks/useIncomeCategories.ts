import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomeCategoriesApi } from '@/services/incomeCategories';
import { useToast } from '@/hooks/use-toast';

export const useIncomeCategories = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['income-categories', params],
    queryFn: () => incomeCategoriesApi.getIncomeCategories(params),
  });
};

export const useIncomeCategory = (id: string) => {
  return useQuery({
    queryKey: ['income-categories', id],
    queryFn: () => incomeCategoriesApi.getIncomeCategory(id),
    enabled: !!id,
  });
};

export const useCreateIncomeCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: incomeCategoriesApi.createIncomeCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] });
      toast({
        title: 'Success',
        description: 'Income category created successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create income category';
      const errorDetails = error.response?.data?.error;
      const fullMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      
      toast({
        title: 'Error',
        description: fullMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateIncomeCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      incomeCategoriesApi.updateIncomeCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] });
      toast({
        title: 'Success',
        description: 'Income category updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update income category';
      const errorDetails = error.response?.data?.error;
      const fullMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      
      toast({
        title: 'Error',
        description: fullMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteIncomeCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: incomeCategoriesApi.deleteIncomeCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] });
      toast({
        title: 'Success',
        description: 'Income category deleted successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete income category';
      const errorDetails = error.response?.data?.error;
      const fullMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
      
      toast({
        title: 'Error',
        description: fullMessage,
        variant: 'destructive',
      });
    },
  });
};