import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Edit, Trash2, Loader2, MapPin, Users, Car, Route, Info, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useTransportRoutes, 
  useCreateTransportRoute, 
  useUpdateTransportRoute, 
  useDeleteTransportRoute 
} from '@/hooks/useTransportRoutes';
import { Vehicle } from '@/services/transportRouteService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';

const TransportRoutes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranchId, setFilterBranchId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];

  const { data: routesResponse, isLoading, error } = useTransportRoutes({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    ...(isSuperAdmin && filterBranchId !== 'all' ? { branchId: filterBranchId } : {})
  });

  const createRouteMutation = useCreateTransportRoute();
  const updateRouteMutation = useUpdateTransportRoute();
  const deleteRouteMutation = useDeleteTransportRoute();

  const [formData, setFormData] = useState({
    routeName: '',
    routeCode: '',
    description: '',
    vehicles: [] as Vehicle[],
    status: 'active' as 'active' | 'inactive',
    branchId: ''
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      routeName: '',
      routeCode: '',
      description: '',
      vehicles: [],
      status: 'active',
      branchId: ''
    });
    setEditingRoute(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];

    if (isSuperAdmin && !formData.branchId) {
      errors.push('Branch is required for super admin');
    }
    
    // Validate vehicles have all required fields (if any vehicles added)
    formData.vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleNumber) errors.push(`Vehicle ${index + 1}: Vehicle number is required`);
      if (!vehicle.driverName) errors.push(`Vehicle ${index + 1}: Driver name is required`);
      if (!vehicle.driverPhone) errors.push(`Vehicle ${index + 1}: Driver phone is required`);
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: 'Validation Error',
        description: `Please fix ${errors.length} error(s) before submitting`,
        variant: 'destructive',
      });
      return;
    }
    
    setValidationErrors([]);

    const payload = {
      ...formData,
      ...(isSuperAdmin && formData.branchId ? { branchId: formData.branchId } : {})
    };

    try {
      if (editingRoute) {
        await updateRouteMutation.mutateAsync({
          id: editingRoute._id,
          data: payload
        });
      } else {
        await createRouteMutation.mutateAsync(payload);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleEdit = (route: any) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      routeCode: route.routeCode,
      description: route.description || '',
      vehicles: route.vehicles || [],
      status: route.status,
      branchId: route.branchId || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, routeName: string) => {
    confirm(
      {
        title: 'Delete Transport Route',
        description: `Are you sure you want to delete "${routeName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      () => {
        deleteRouteMutation.mutate(id);
      }
    );
  };

  const routes = routesResponse?.data || [];
  const pagination = routesResponse?.pagination;

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load transport routes</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="w-8 h-8 text-blue-500" />
              Transport Routes
            </h1>
            <p className="text-muted-foreground mt-1">Manage transport routes and vehicle information. Transport fees are configured in Fee Structures.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Transport Route
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  {editingRoute ? 'Edit Transport Route' : 'Add New Transport Route'}
                </DialogTitle>
                <DialogDescription>
                  {editingRoute ? 'Update transport route information and vehicle details' : 'Create a transport route with basic information and vehicle details'}
                </DialogDescription>
              </DialogHeader>
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Please fix the following errors:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {validationErrors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li className="text-muted-foreground">...and {validationErrors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Basic Information
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Enter the route identification details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                {isSuperAdmin && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="branchId">Branch *</Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={value => setFormData({ ...formData, branchId: value })}
                      required
                    >
                      <SelectTrigger id="branchId">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch: any) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="routeName">Route Name *</Label>
                    <Input
                      id="routeName"
                      placeholder="e.g., Route A, North Zone"
                      value={formData.routeName}
                      onChange={e => setFormData({ ...formData, routeName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routeCode">Route Code *</Label>
                    <Input
                      id="routeCode"
                      placeholder="e.g., RT-A, NZ-01"
                      value={formData.routeCode}
                      onChange={e => setFormData({ ...formData, routeCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter route description and coverage areas (e.g., Covers Manama, Riffa areas)"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Car className="w-4 h-4 text-purple-500" />
                      Vehicle & Driver Information
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Add vehicle details and driver contact information for this route
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          vehicles: [
                            ...formData.vehicles,
                            { vehicleNumber: '', driverName: '', driverPhone: '' }
                          ]
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Vehicle
                    </Button>
                  </div>
                  
                  {formData.vehicles.length > 0 ? (
                    <div className="space-y-3">
                      {formData.vehicles.map((vehicle, index) => (
                        <div key={index} className="grid grid-cols-4 gap-3 items-end p-4 border-2 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-md transition-shadow">
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              Vehicle Number *
                            </Label>
                            <Input
                              placeholder="BH-12-3456"
                              value={vehicle.vehicleNumber}
                              onChange={(e) => {
                                const newVehicles = [...formData.vehicles];
                                newVehicles[index] = {
                                  ...newVehicles[index],
                                  vehicleNumber: e.target.value
                                };
                                setFormData({ ...formData, vehicles: newVehicles });
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Driver Name *
                            </Label>
                            <Input
                              placeholder="Full name"
                              value={vehicle.driverName}
                              onChange={(e) => {
                                const newVehicles = [...formData.vehicles];
                                newVehicles[index] = {
                                  ...newVehicles[index],
                                  driverName: e.target.value
                                };
                                setFormData({ ...formData, vehicles: newVehicles });
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              📞 Driver Phone *
                            </Label>
                            <Input
                              type="tel"
                              placeholder="+973 XXXX XXXX"
                              value={vehicle.driverPhone}
                              onChange={(e) => {
                                const newVehicles = [...formData.vehicles];
                                newVehicles[index] = {
                                  ...newVehicles[index],
                                  driverPhone: e.target.value
                                };
                                setFormData({ ...formData, vehicles: newVehicles });
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newVehicles = formData.vehicles.filter((_, i) => i !== index);
                              setFormData({ ...formData, vehicles: newVehicles });
                            }}
                            title="Remove vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Car className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold mb-1">No vehicles added</div>
                        <p className="text-sm">Click "Add Vehicle" above to add vehicle and driver information for this route (optional).</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRouteMutation.isPending || updateRouteMutation.isPending}
                  >
                    {(createRouteMutation.isPending || updateRouteMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingRoute ? 'Update' : 'Create'} Route
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Routes</p>
                  <h3 className="text-2xl font-bold mt-1">{pagination?.total || 0}</h3>
                </div>
                <Route className="w-8 h-8 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Routes</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {routes.filter((r: any) => r.status === 'active').length}
                  </h3>
                </div>
                <Check className="w-8 h-8 text-green-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {routes.reduce((sum: number, r: any) => sum + (r.vehicles?.length || 0), 0)}
                  </h3>
                </div>
                <Car className="w-8 h-8 text-purple-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isSuperAdmin && branches.length > 0 && (
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium shrink-0">Filter by Branch:</Label>
            <Select value={filterBranchId} onValueChange={(val) => { setFilterBranchId(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch: any) => (
                  <SelectItem key={branch._id} value={branch._id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DataTable
          searchPlaceholder="Search by route name or code..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          pagination={{
            currentPage,
            totalPages: pagination?.pages || 1,
            totalItems: pagination?.total || 0,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          data={routes}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No transport routes found"
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Route Code</th>
                  <th className="text-left p-3 font-semibold">Route Name</th>
                  {isSuperAdmin && <th className="text-left p-3 font-semibold">Branch</th>}
                  <th className="text-left p-3 font-semibold">Vehicles</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route: any) => (
                  <tr key={route._id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <span className="font-mono text-sm font-semibold">{route.routeCode}</span>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-semibold">{route.routeName}</span>
                        {route.description && (
                          <p className="text-xs text-muted-foreground mt-1">{route.description}</p>
                        )}
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="p-3">
                        <span className="text-sm">
                          {branches.find((b: any) => b._id === route.branchId)?.name || <span className="text-muted-foreground text-xs">—</span>}
                        </span>
                      </td>
                    )}
                    <td className="p-3">
                      {route.vehicles?.length > 0 ? (
                        <div className="space-y-1">
                          {route.vehicles.map((v: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Car className="w-3 h-3" />
                              <span className="font-medium">{v.vehicleNumber}</span>
                              {v.driverName && <span>— {v.driverName}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No vehicles</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={route.status === 'active' ? 'default' : 'secondary'}
                        className={route.status === 'active' ? 'bg-green-500' : ''}
                      >
                        {route.status === 'active' ? '✓ Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(route)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(route._id, route.routeName)}
                          disabled={deleteRouteMutation.isPending}
                        >
                          {deleteRouteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      </div>
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default TransportRoutes;
