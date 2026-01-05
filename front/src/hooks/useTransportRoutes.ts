import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  transportRouteService, 
  TransportRouteQueryParams, 
  CreateTransportRouteData 
} from '@/services/transportRouteService';
import { useToast } from './use-toast';

export const useTransportRoutes = (params?: TransportRouteQueryParams) => {
  return useQuery({
    queryKey: ['transportRoutes', params],
    queryFn: () => transportRouteService.getTransportRoutes(params)
  });
};

export const useTransportRoute = (id: string) => {
  return useQuery({
    queryKey: ['transportRoute', id],
    queryFn: () => transportRouteService.getTransportRoute(id),
    enabled: !!id
  });
};

export const useCreateTransportRoute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTransportRouteData) => 
      transportRouteService.createTransportRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      toast({
        title: 'Success',
        description: 'Transport route created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create transport route',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateTransportRoute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransportRouteData> }) =>
      transportRouteService.updateTransportRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      queryClient.invalidateQueries({ queryKey: ['transportRoute'] });
      toast({
        title: 'Success',
        description: 'Transport route updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update transport route',
        variant: 'destructive',
      });
    }
  });
};

export const useDeleteTransportRoute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => transportRouteService.deleteTransportRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportRoutes'] });
      toast({
        title: 'Success',
        description: 'Transport route deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete transport route',
        variant: 'destructive',
      });
    }
  });
};
