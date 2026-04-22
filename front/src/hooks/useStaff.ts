import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService, StaffQueryParams, CreateStaffData, SalaryIncrementData, SeparationData } from '@/services/staffService';
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
        description: error.response?.data?.message || 'Something went wrong while creating the staff member. Please try again.',
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
        description: error.response?.data?.message || 'Something went wrong while updating the staff member. Please try again.',
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
        description: error.response?.data?.message || 'Something went wrong while deleting the staff member. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Salary increment mutation
export const useSalaryIncrement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalaryIncrementData }) =>
      staffService.addSalaryIncrement(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Salary increment recorded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while recording the salary increment. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Get salary history
export const useSalaryHistory = (id: string) => {
  return useQuery({
    queryKey: ['staffSalaryHistory', id],
    queryFn: () => staffService.getSalaryHistory(id),
    enabled: !!id,
  });
};

// Staff separation mutation
export const useStaffSeparation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SeparationData }) =>
      staffService.recordSeparation(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Separation recorded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while recording the separation. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Experience certificate query
export const useExperienceCertificate = (id: string) => {
  return useQuery({
    queryKey: ['staffExpCert', id],
    queryFn: () => staffService.getExperienceCertificate(id),
    enabled: !!id,
  });
};