import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  textbookIndentService, 
  TextbookIndentQueryParams 
} from '@/services/textbookIndentService';
import { 
  CreateTextbookIndentData, 
  UpdateTextbookIndentData, 
  ReturnTextbookData 
} from '@/types/textbookIndent';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const textbookIndentKeys = {
  all: ['textbook-indents'] as const,
  lists: () => [...textbookIndentKeys.all, 'list'] as const,
  list: (params: TextbookIndentQueryParams) => [...textbookIndentKeys.lists(), params] as const,
  details: () => [...textbookIndentKeys.all, 'detail'] as const,
  detail: (id: string) => [...textbookIndentKeys.details(), id] as const,
  stats: () => [...textbookIndentKeys.all, 'stats'] as const,
  overdue: () => [...textbookIndentKeys.all, 'overdue'] as const,
  studentHistory: (studentId: string) => [...textbookIndentKeys.all, 'student', studentId] as const,
};

// Get textbook indents with pagination and filters
export const useTextbookIndents = (params?: TextbookIndentQueryParams) => {
  return useQuery({
    queryKey: textbookIndentKeys.list(params || {}),
    queryFn: () => textbookIndentService.getTextbookIndents(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single textbook indent
export const useTextbookIndent = (id: string) => {
  return useQuery({
    queryKey: textbookIndentKeys.detail(id),
    queryFn: () => textbookIndentService.getTextbookIndent(id),
    enabled: !!id,
  });
};

// Get textbook indent statistics
export const useTextbookIndentStats = () => {
  return useQuery({
    queryKey: textbookIndentKeys.stats(),
    queryFn: () => textbookIndentService.getTextbookIndentStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get overdue textbook indents
export const useOverdueIndents = () => {
  return useQuery({
    queryKey: textbookIndentKeys.overdue(),
    queryFn: () => textbookIndentService.getOverdueIndents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get student textbook history
export const useStudentTextbookHistory = (studentId: string) => {
  return useQuery({
    queryKey: textbookIndentKeys.studentHistory(studentId),
    queryFn: () => textbookIndentService.getStudentTextbookHistory(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create textbook indent mutation
export const useCreateTextbookIndent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTextbookIndentData) => textbookIndentService.createTextbookIndent(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['textbooks'] }); // Invalidate textbook inventory
      toast({
        title: 'Success',
        description: response.message || 'Textbook indent created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create textbook indent',
        variant: 'destructive',
      });
    },
  });
};

// Update textbook indent mutation
export const useUpdateTextbookIndent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTextbookIndentData }) =>
      textbookIndentService.updateTextbookIndent(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.all });
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Textbook indent updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update textbook indent',
        variant: 'destructive',
      });
    },
  });
};

// Issue textbook indent mutation
export const useIssueTextbookIndent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => textbookIndentService.issueTextbookIndent(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.all });
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['textbooks'] }); // Invalidate textbook inventory
      toast({
        title: 'Success',
        description: response.message || 'Textbooks issued successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to issue textbooks',
        variant: 'destructive',
      });
    },
  });
};

// Return textbooks mutation
export const useReturnTextbooks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReturnTextbookData }) =>
      textbookIndentService.returnTextbooks(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.all });
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['textbooks'] }); // Invalidate textbook inventory
      toast({
        title: 'Success',
        description: response.message || 'Textbooks returned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to return textbooks',
        variant: 'destructive',
      });
    },
  });
};

// Cancel textbook indent mutation
export const useCancelTextbookIndent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      textbookIndentService.cancelTextbookIndent(id, reason),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.all });
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['textbooks'] }); // Invalidate textbook inventory
      toast({
        title: 'Success',
        description: response.message || 'Textbook indent cancelled successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel textbook indent',
        variant: 'destructive',
      });
    },
  });
};

// Generate receipt mutation
export const useGenerateTextbookReceipt = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => textbookIndentService.generateReceipt(id),
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: response.message || 'Receipt generated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate receipt',
        variant: 'destructive',
      });
    },
  });
};

// Bulk issue for class mutation
export const useBulkIssueForClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ classId, textbookIds }: { classId: string; textbookIds: string[] }) =>
      textbookIndentService.bulkIssueForClass(classId, textbookIds),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: textbookIndentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['textbooks'] }); // Invalidate textbook inventory
      toast({
        title: 'Success',
        description: response.message || 'Bulk textbook issue completed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete bulk textbook issue',
        variant: 'destructive',
      });
    },
  });
};