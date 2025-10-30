import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, StudentQueryParams, CreateStudentData } from '@/services/studentService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (params: StudentQueryParams) => [...studentKeys.lists(), params] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  stats: () => [...studentKeys.all, 'stats'] as const,
};

// Get students with pagination and filters
export const useStudents = (params?: StudentQueryParams) => {
  return useQuery({
    queryKey: studentKeys.list(params || {}),
    queryFn: () => studentService.getStudents(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single student
export const useStudent = (id: string) => {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getStudent(id),
    enabled: !!id,
  });
};

// Get student statistics
export const useStudentStats = () => {
  return useQuery({
    queryKey: studentKeys.stats(),
    queryFn: () => studentService.getStudentStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create student mutation
export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateStudentData) => studentService.createStudent(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Student created successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create student';
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

// Update student mutation
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStudentData> }) =>
      studentService.updateStudent(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      toast({
        title: 'Success',
        description: response.message || 'Student updated successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
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

// Delete student mutation
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast({
        title: 'Success',
        description: response.message || 'Student deleted successfully',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete student';
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