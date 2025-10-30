import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService, StaffQueryParams, CreateStaffData } from '@/services/staffService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (params: StaffQueryParams) => [...staffKeys.lists(), params] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
  stats: () => [...staffKeys.all, 'stats'] as const,
};

// Get staff with pagination and filters
export const useStaff = (params?: StaffQueryParams) => {
  return useQuery({
    queryKey: staffKeys.list(params || {}),
    queryFn: () => staffService.getStaff(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single staff member
export const useStaffMember = (id: string) => {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => staffService.getStaffMember(id),
    enabled: !!id,
  });
};

// Get staff statistics
export const useStaffStats = () => {
  return useQuery({
    queryKey: staffKeys.stats(),
    queryFn: () => staffService.getStaffStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create staff mutation
export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStaffData) => staffService.createStaff(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Staff member created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create staff member',
        variant: 'destructive',
      });
    },
  });
};

// Update staff mutation
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStaffData> }) =>
      staffService.updateStaff(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Staff member updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update staff member',
        variant: 'destructive',
      });
    },
  });
};

// Delete staff mutation
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Staff member deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete staff member',
        variant: 'destructive',
      });
    },
  });
};