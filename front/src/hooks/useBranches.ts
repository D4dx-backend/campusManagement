import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/services/branches';
import { useToast } from '@/hooks/use-toast';

export const useBranches = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getBranches(),
    enabled: enabled,
  });
};

export const useBranch = (id: string) => {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: () => branchesApi.getBranch(id),
    enabled: !!id,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: branchesApi.createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: 'Success',
        description: 'Branch created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create branch',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      branchesApi.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: 'Success',
        description: 'Branch updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update branch',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: branchesApi.deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete branch',
        variant: 'destructive',
      });
    },
  });
};