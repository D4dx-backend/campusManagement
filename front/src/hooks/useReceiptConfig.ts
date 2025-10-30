import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptService, CreateReceiptConfigData, UpdateReceiptConfigData } from '@/services/receiptService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const receiptConfigKeys = {
  all: ['receiptConfigs'] as const,
  lists: () => [...receiptConfigKeys.all, 'list'] as const,
  byBranch: (branchId: string) => [...receiptConfigKeys.all, 'branch', branchId] as const,
};

// Get all receipt configurations
export const useReceiptConfigs = () => {
  return useQuery({
    queryKey: receiptConfigKeys.lists(),
    queryFn: () => receiptService.getReceiptConfigs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get receipt config by branch
export const useReceiptConfigByBranch = (branchId: string) => {
  return useQuery({
    queryKey: receiptConfigKeys.byBranch(branchId),
    queryFn: () => receiptService.getReceiptConfigByBranch(branchId),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's an access denied error
      if (error?.response?.status === 403 || error?.response?.data?.message?.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Get current user's receipt config (API handles branch automatically)
export const useCurrentReceiptConfig = () => {
  return useQuery({
    queryKey: ['receiptConfig', 'current'],
    queryFn: () => receiptService.getCurrentReceiptConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create receipt configuration
export const useCreateReceiptConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateReceiptConfigData) => receiptService.createReceiptConfig(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: receiptConfigKeys.all });
      toast({
        title: "Success! 🎉",
        description: "Receipt configuration created successfully. You can now generate professional receipts.",
      });
    },
    onError: (error: any) => {
      console.error('Create receipt config error:', error);
      
      let title = "Permission Error";
      let description = error.message || error.response?.data?.message || "Failed to create receipt configuration";
      
      // Check if it's a permission error
      if (error.message?.includes('Permission denied') || error.message?.includes('receipt-config')) {
        title = "Permission Required";
        description = "Branch admin needs 'receipt-config' permissions. Please check the instructions above to add the required permission.";
      } else if (error.response?.status === 403) {
        title = "Access Denied";
        description = "You don't have permission to create receipt configurations. Please contact your administrator.";
      } else if (error.response?.status === 401) {
        title = "Authentication Error";
        description = "Please logout and login again to refresh your permissions.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });
};

// Update receipt configuration
export const useUpdateReceiptConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReceiptConfigData }) => 
      receiptService.updateReceiptConfig(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: receiptConfigKeys.all });
      toast({
        title: "Success",
        description: "Receipt configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update receipt configuration",
        variant: "destructive",
      });
    },
  });
};

// Delete receipt configuration
export const useDeleteReceiptConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => receiptService.deleteReceiptConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptConfigKeys.all });
      toast({
        title: "Success",
        description: "Receipt configuration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete receipt configuration",
        variant: "destructive",
      });
    },
  });
};