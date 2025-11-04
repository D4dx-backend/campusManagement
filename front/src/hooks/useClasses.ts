import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '@/services/classes';
import { useToast } from '@/hooks/use-toast';

export const useClasses = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  academicYear?: string;
}) => {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => classesApi.getClasses(params),
  });
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => classesApi.getClass(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: classesApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Success',
        description: 'Class created successfully',
      });
    },
    onError: (error: any) => {
      console.error('❌ Create class error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error('Full error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Full error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.response?.data?.error || 'Failed to create class',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      classesApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Success',
        description: 'Class updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update class',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: classesApi.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete class',
        variant: 'destructive',
      });
    },
  });
};

export const useClassStats = () => {
  return useQuery({
    queryKey: ['classes', 'stats'],
    queryFn: classesApi.getClassStats,
  });
};