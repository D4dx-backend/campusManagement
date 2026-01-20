import { apiClient } from '@/lib/api';

export interface DistanceGroupFee {
  groupName: string;
  distanceRange: string;
  amount: number;
}

export interface ClassFee {
  classId: string;
  className: string;
  amount: number;
  staffDiscount: number;
  distanceGroupFees?: DistanceGroupFee[];
}

export interface Vehicle {
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
}

export interface TransportRoute {
  _id: string;
  routeName: string;
  routeCode: string;
  description?: string;
  classFees: ClassFee[];
  useDistanceGroups: boolean;
  vehicles: Vehicle[];
  status: 'active' | 'inactive';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportRouteQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTransportRouteData {
  routeName: string;
  routeCode: string;
  description?: string;
  classFees: ClassFee[];
  useDistanceGroups?: boolean;
  vehicles?: Vehicle[];
  status?: 'active' | 'inactive';
}

export const transportRouteService = {
  // Get all transport routes
  getTransportRoutes: async (params?: TransportRouteQueryParams) => {
    const response = await apiClient.get<TransportRoute[]>('/transport-routes', params);
    return response.data;
  },

  // Get transport route by ID
  getTransportRoute: async (id: string) => {
    const response = await apiClient.get<TransportRoute>(`/transport-routes/${id}`);
    return response.data;
  },

  // Create new transport route
  createTransportRoute: async (routeData: CreateTransportRouteData) => {
    const response = await apiClient.post<TransportRoute>('/transport-routes', routeData);
    return response.data;
  },

  // Update transport route
  updateTransportRoute: async (id: string, routeData: Partial<CreateTransportRouteData>) => {
    const response = await apiClient.put<TransportRoute>(`/transport-routes/${id}`, routeData);
    return response.data;
  },

  // Delete transport route
  deleteTransportRoute: async (id: string) => {
    const response = await apiClient.delete(`/transport-routes/${id}`);
    return response.data;
  }
};
