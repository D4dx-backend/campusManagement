import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Edit, Trash2, Loader2, MapPin, ChevronDown, ChevronUp, DollarSign, Users, Car, Route, Info, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useTransportRoutes, 
  useCreateTransportRoute, 
  useUpdateTransportRoute, 
  useDeleteTransportRoute 
} from '@/hooks/useTransportRoutes';
import { useClasses } from '@/hooks/useClasses';
import { ClassFee, Vehicle, DistanceGroupFee } from '@/services/transportRouteService';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const TransportRoutes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  const { data: routesResponse, isLoading, error } = useTransportRoutes({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: 'active'
  });

  const createRouteMutation = useCreateTransportRoute();
  const updateRouteMutation = useUpdateTransportRoute();
  const deleteRouteMutation = useDeleteTransportRoute();

  const { data: classesResponse } = useClasses({ status: 'active', limit: 100 });
  const classes = classesResponse?.data || [];

  const [formData, setFormData] = useState({
    routeName: '',
    routeCode: '',
    description: '',
    classFees: [] as ClassFee[],
    useDistanceGroups: false,
    vehicles: [] as Vehicle[],
    status: 'active' as 'active' | 'inactive'
  });

  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      routeName: '',
      routeCode: '',
      description: '',
      classFees: [],
      useDistanceGroups: false,
      vehicles: [],
      status: 'active'
    });
    setExpandedClass(null);
    setEditingRoute(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];
    
    if (formData.classFees.length === 0) {
      errors.push('Please add at least one class fee');
    }
    
    // Validate vehicles have all required fields (if any vehicles added)
    formData.vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleNumber) errors.push(`Vehicle ${index + 1}: Vehicle number is required`);
      if (!vehicle.driverName) errors.push(`Vehicle ${index + 1}: Driver name is required`);
      if (!vehicle.driverPhone) errors.push(`Vehicle ${index + 1}: Driver phone is required`);
    });
    
    // Validate distance groups if enabled
    if (formData.useDistanceGroups) {
      formData.classFees.forEach(fee => {
        if (!fee.distanceGroupFees || fee.distanceGroupFees.length === 0) {
          errors.push(`${fee.className}: Please add distance groups or disable distance-based pricing`);
        } else {
          fee.distanceGroupFees?.forEach((group, idx) => {
            if (!group.groupName) errors.push(`${fee.className} - Group ${idx + 1}: Name is required`);
            if (!group.distanceRange) errors.push(`${fee.className} - Group ${idx + 1}: Distance range is required`);
            if (group.amount <= 0) errors.push(`${fee.className} - Group ${idx + 1}: Amount must be greater than 0`);
          });
        }
      });
    }
    
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

    try {
      if (editingRoute) {
        await updateRouteMutation.mutateAsync({
          id: editingRoute._id,
          data: formData
        });
      } else {
        await createRouteMutation.mutateAsync(formData);
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
      classFees: route.classFees || [],
      useDistanceGroups: route.useDistanceGroups || false,
      vehicles: route.vehicles || [],
      status: route.status
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
            <p className="text-muted-foreground mt-1">Manage transport routes with class-wise fees, distance groups, and vehicle information</p>
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
                  {editingRoute ? 'Update transport route information, fees, and vehicle details' : 'Create a comprehensive transport route with class-wise fees, distance groups, and vehicle information'}
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
                      <DollarSign className="w-4 h-4 text-green-500" />
                      Fee Structure
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure class-wise transport fees and optional distance-based pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Checkbox 
                      id="useDistanceGroups"
                      checked={formData.useDistanceGroups}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, useDistanceGroups: checked as boolean });
                        if (!checked) {
                          // Clear distance group fees when disabled
                          const updatedFees = formData.classFees.map(fee => ({
                            ...fee,
                            distanceGroupFees: []
                          }));
                          setFormData({ ...formData, useDistanceGroups: false, classFees: updatedFees });
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="useDistanceGroups" className="font-semibold cursor-pointer">
                        Enable Distance-based Fee Groups
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Allow different fees based on travel distance for each class (e.g., 0-5km, 5-10km)
                      </p>
                    </div>
                  </div>
                  
                  <Label>Class-wise Fees and Staff Discount *</Label>
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Class</th>
                          <th className="text-left p-3 font-semibold">Amount (BHD) *</th>
                          <th className="text-left p-3 font-semibold">Staff Discount (%)</th>
                          <th className="text-left p-3 font-semibold">Discounted Amount</th>
                          {formData.useDistanceGroups && (
                            <th className="text-left p-3 font-semibold">Distance Groups</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls: any) => {
                          const existingFee = formData.classFees.find(cf => cf.classId === cls._id);
                          const amount = existingFee?.amount || 0;
                          const discount = existingFee?.staffDiscount || 0;
                          const discountedAmount = amount > 0 && discount > 0 
                            ? amount - (amount * discount / 100)
                            : null;
                          
                          return (
                            <>
                            <tr key={cls._id} className="border-b hover:bg-muted/30">
                              <td className="p-3">
                                <Label className="font-medium">{cls.name} ({cls.academicYear})</Label>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="max-w-[150px]"
                                  value={amount || ''}
                                  onChange={(e) => {
                                    const newAmount = parseFloat(e.target.value) || 0;
                                    const existingIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                    const newClassFees = [...formData.classFees];
                                    
                                    if (newAmount > 0) {
                                      if (existingIndex >= 0) {
                                        newClassFees[existingIndex] = { 
                                          ...newClassFees[existingIndex],
                                          amount: newAmount 
                                        };
                                      } else {
                                        newClassFees.push({ 
                                          classId: cls._id, 
                                          className: cls.name, 
                                          amount: newAmount,
                                          staffDiscount: 0
                                        });
                                      }
                                    } else {
                                      if (existingIndex >= 0) {
                                        newClassFees.splice(existingIndex, 1);
                                      }
                                    }
                                    
                                    setFormData({ ...formData, classFees: newClassFees });
                                  }}
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  className="max-w-[100px]"
                                  value={discount || ''}
                                  onChange={(e) => {
                                    const newDiscount = parseFloat(e.target.value) || 0;
                                    const existingIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                    const newClassFees = [...formData.classFees];
                                    
                                    if (existingIndex >= 0) {
                                      newClassFees[existingIndex] = { 
                                        ...newClassFees[existingIndex],
                                        staffDiscount: newDiscount 
                                      };
                                      setFormData({ ...formData, classFees: newClassFees });
                                    } else if (newDiscount > 0) {
                                      // Only create entry if there's a discount value
                                      newClassFees.push({ 
                                        classId: cls._id, 
                                        className: cls.name, 
                                        amount: 0,
                                        staffDiscount: newDiscount
                                      });
                                      setFormData({ ...formData, classFees: newClassFees });
                                    }
                                  }}
                                  disabled={!existingFee || amount === 0}
                                />
                              </td>
                              <td className="p-3">
                                {discountedAmount !== null ? (
                                  <span className="text-sm font-medium text-green-600">
                                    BHD {discountedAmount.toFixed(3)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              {formData.useDistanceGroups && (
                                <td className="p-3">
                                  {existingFee && amount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setExpandedClass(expandedClass === cls._id ? null : cls._id)}
                                    >
                                      {expandedClass === cls._id ? (
                                        <>
                                          <ChevronUp className="w-4 h-4 mr-1" />
                                          Hide Groups
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-4 h-4 mr-1" />
                                          {existingFee.distanceGroupFees?.length || 0} Groups
                                        </>
                                      )}
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </td>
                              )}
                            </tr>
                            {formData.useDistanceGroups && expandedClass === cls._id && existingFee && (
                              <tr>
                                <td colSpan={5} className="p-4 bg-muted/20">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm font-semibold">Distance Groups for {cls.name}</Label>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const classIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                          if (classIndex >= 0) {
                                            const newClassFees = [...formData.classFees];
                                            const distanceGroupFees = newClassFees[classIndex].distanceGroupFees || [];
                                            distanceGroupFees.push({
                                              groupName: `Group ${distanceGroupFees.length + 1}`,
                                              distanceRange: '',
                                              amount: 0
                                            });
                                            newClassFees[classIndex] = {
                                              ...newClassFees[classIndex],
                                              distanceGroupFees
                                            };
                                            setFormData({ ...formData, classFees: newClassFees });
                                          }
                                        }}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Group
                                      </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {(existingFee.distanceGroupFees || []).map((group, groupIndex) => (
                                        <div key={groupIndex} className="grid grid-cols-4 gap-2 items-end">
                                          <div>
                                            <Label className="text-xs">Group Name</Label>
                                            <Input
                                              placeholder="e.g., Group 1"
                                              value={group.groupName}
                                              onChange={(e) => {
                                                const classIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                                if (classIndex >= 0) {
                                                  const newClassFees = [...formData.classFees];
                                                  const distanceGroupFees = [...(newClassFees[classIndex].distanceGroupFees || [])];
                                                  distanceGroupFees[groupIndex] = {
                                                    ...distanceGroupFees[groupIndex],
                                                    groupName: e.target.value
                                                  };
                                                  newClassFees[classIndex] = {
                                                    ...newClassFees[classIndex],
                                                    distanceGroupFees
                                                  };
                                                  setFormData({ ...formData, classFees: newClassFees });
                                                }
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Distance Range</Label>
                                            <Input
                                              placeholder="e.g., 0-5 km"
                                              value={group.distanceRange}
                                              onChange={(e) => {
                                                const classIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                                if (classIndex >= 0) {
                                                  const newClassFees = [...formData.classFees];
                                                  const distanceGroupFees = [...(newClassFees[classIndex].distanceGroupFees || [])];
                                                  distanceGroupFees[groupIndex] = {
                                                    ...distanceGroupFees[groupIndex],
                                                    distanceRange: e.target.value
                                                  };
                                                  newClassFees[classIndex] = {
                                                    ...newClassFees[classIndex],
                                                    distanceGroupFees
                                                  };
                                                  setFormData({ ...formData, classFees: newClassFees });
                                                }
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Amount (BHD)</Label>
                                            <Input
                                              type="number"
                                              step="0.001"
                                              min="0"
                                              placeholder="0.000"
                                              value={group.amount || ''}
                                              onChange={(e) => {
                                                const classIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                                if (classIndex >= 0) {
                                                  const newClassFees = [...formData.classFees];
                                                  const distanceGroupFees = [...(newClassFees[classIndex].distanceGroupFees || [])];
                                                  distanceGroupFees[groupIndex] = {
                                                    ...distanceGroupFees[groupIndex],
                                                    amount: parseFloat(e.target.value) || 0
                                                  };
                                                  newClassFees[classIndex] = {
                                                    ...newClassFees[classIndex],
                                                    distanceGroupFees
                                                  };
                                                  setFormData({ ...formData, classFees: newClassFees });
                                                }
                                              }}
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const classIndex = formData.classFees.findIndex(cf => cf.classId === cls._id);
                                              if (classIndex >= 0) {
                                                const newClassFees = [...formData.classFees];
                                                const distanceGroupFees = [...(newClassFees[classIndex].distanceGroupFees || [])];
                                                distanceGroupFees.splice(groupIndex, 1);
                                                newClassFees[classIndex] = {
                                                  ...newClassFees[classIndex],
                                                  distanceGroupFees
                                                };
                                                setFormData({ ...formData, classFees: newClassFees });
                                              }
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      
                                      {(!existingFee.distanceGroupFees || existingFee.distanceGroupFees.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-2">
                                          No distance groups added yet
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Distance-Based</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {routes.filter((r: any) => r.useDistanceGroups).length}
                  </h3>
                </div>
                <MapPin className="w-8 h-8 text-orange-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <th className="text-left p-3 font-semibold">Classes</th>
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
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-3 h-3" />
                          {route.classFees?.length || 0} classes
                        </div>
                        {route.useDistanceGroups && (
                          <Badge variant="secondary" className="text-xs">
                            Distance-based
                          </Badge>
                        )}
                        {route.vehicles?.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Car className="w-3 h-3" />
                            {route.vehicles.length} vehicle(s)
                          </div>
                        )}
                      </div>
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
