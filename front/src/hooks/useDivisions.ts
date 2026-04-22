import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionsApi } from '@/services/divisions';
import { useToast } from '@/hooks/use-toast';

export const useDivisions = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['divisions', params],
    queryFn: () => divisionsApi.getDivisions(params),
  });
};

export const useDivision = (id: string) => {
  return useQuery({
    queryKey: ['divisions', id],
    queryFn: () => divisionsApi.getDivision(id),
    enabled: !!id,
  });
};

export const useDivisionsByClass = (classId: string) => {
  return useQuery({
    queryKey: ['divisions', 'class', classId],
    queryFn: () => divisionsApi.getDivisionsByClass(classId),
    enabled: !!classId,
  });
};

export const useCreateDivision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: divisionsApi.createDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast({
        title: 'Success',
        description: 'Division created successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Something went wrong while creating the division. Please try again.';
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

export const useUpdateDivision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      divisionsApi.updateDivision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast({
        title: 'Success',
        description: 'Division updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Something went wrong while updating the division. Please try again.';
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

export const useDeleteDivision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: divisionsApi.deleteDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast({
        title: 'Success',
        description: 'Division deleted successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Something went wrong while deleting the division. Please try again.';
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

export const useDivisionStats = () => {
  return useQuery({
    queryKey: ['divisions', 'stats'],
    queryFn: divisionsApi.getDivisionStats,
  });
};