import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/services/departments';
import { useToast } from '@/hooks/use-toast';

export const useDepartments = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () => departmentsApi.getDepartments(params),
  });
};

export const useDepartment = (id: string) => {
  return useQuery({
    queryKey: ['departments', id],
    queryFn: () => departmentsApi.getDepartment(id),
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Success',
        description: 'Department created successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create department';
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

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      departmentsApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update department';
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

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: departmentsApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete department';
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