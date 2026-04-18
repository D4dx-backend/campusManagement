import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/services/organizations';
import { useToast } from '@/hooks/use-toast';

export const useOrganizations = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.getOrganizations(),
    enabled,
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationsApi.getOrganization(id),
    enabled: !!id,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: organizationsApi.createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create organization',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      organizationsApi.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: organizationsApi.deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete organization',
        variant: 'destructive',
      });
    },
  });
};
