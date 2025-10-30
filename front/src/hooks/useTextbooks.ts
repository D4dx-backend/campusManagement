import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { textbookService, TextbookQueryParams, CreateTextbookData } from '@/services/textbookService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const textbookKeys = {
  all: ['textbooks'] as const,
  lists: () => [...textbookKeys.all, 'list'] as const,
  list: (params: TextbookQueryParams) => [...textbookKeys.lists(), params] as const,
  details: () => [...textbookKeys.all, 'detail'] as const,
  detail: (id: string) => [...textbookKeys.details(), id] as const,
  stats: () => [...textbookKeys.all, 'stats'] as const,
};

// Get textbooks with pagination and filters
export const useTextbooks = (params?: TextbookQueryParams) => {
  return useQuery({
    queryKey: textbookKeys.list(params || {}),
    queryFn: () => textbookService.getTextbooks(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single textbook
export const useTextbook = (id: string) => {
  return useQuery({
    queryKey: textbookKeys.detail(id),
    queryFn: () => textbookService.getTextbook(id),
    enabled: !!id,
  });
};

// Get textbook statistics
export const useTextbookStats = () => {
  return useQuery({
    queryKey: textbookKeys.stats(),
    queryFn: () => textbookService.getTextbookStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create textbook mutation
export const useCreateTextbook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTextbookData) => textbookService.createTextbook(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: textbookKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Textbook created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create textbook',
        variant: 'destructive',
      });
    },
  });
};

// Update textbook mutation
export const useUpdateTextbook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTextbookData> }) =>
      textbookService.updateTextbook(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: textbookKeys.all });
      queryClient.invalidateQueries({ queryKey: textbookKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Textbook updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update textbook',
        variant: 'destructive',
      });
    },
  });
};

// Delete textbook mutation
export const useDeleteTextbook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => textbookService.deleteTextbook(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: textbookKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Textbook deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete textbook',
        variant: 'destructive',
      });
    },
  });
};

// Update stock mutation
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, adjustment, reason }: { id: string; adjustment: number; reason?: string }) =>
      textbookService.updateStock(id, adjustment, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: textbookKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Stock updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update stock',
        variant: 'destructive',
      });
    },
  });
};