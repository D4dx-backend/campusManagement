import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designationsApi } from '@/services/designations';
import { useToast } from '@/hooks/use-toast';

export const useDesignations = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['designations', params],
    queryFn: () => designationsApi.getDesignations(params),
  });
};

export const useDesignation = (id: string) => {
  return useQuery({
    queryKey: ['designations', id],
    queryFn: () => designationsApi.getDesignation(id),
    enabled: !!id,
  });
};

export const useCreateDesignation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: designationsApi.createDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast({
        title: 'Success',
        description: 'Designation created successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create designation';
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

export const useUpdateDesignation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      designationsApi.updateDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast({
        title: 'Success',
        description: 'Designation updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update designation';
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

export const useDeleteDesignation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: designationsApi.deleteDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast({
        title: 'Success',
        description: 'Designation deleted successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete designation';
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