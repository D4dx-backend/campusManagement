import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffCategoriesApi } from '@/services/staffCategories';
import { useToast } from '@/hooks/use-toast';

export const useStaffCategories = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['staffCategories', params],
    queryFn: () => staffCategoriesApi.getStaffCategories(params),
  });
};

export const useCreateStaffCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: staffCategoriesApi.createStaffCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast({
        title: 'Success',
        description: 'Staff category created successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Something went wrong while creating the staff category. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateStaffCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      staffCategoriesApi.updateStaffCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast({
        title: 'Success',
        description: 'Staff category updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Something went wrong while updating the staff category. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteStaffCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: staffCategoriesApi.deleteStaffCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast({
        title: 'Success',
        description: 'Staff category deleted successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Something went wrong while deleting the staff category. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};
