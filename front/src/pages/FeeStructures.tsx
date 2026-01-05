import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import feeStructureService, { FeeStructure } from '@/services/feeStructureService';
import { useClasses } from '@/hooks/useClasses';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';

const FeeStructures = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [classAmounts, setClassAmounts] = useState<Record<string, string>>({});
  const [classStaffDiscounts, setClassStaffDiscounts] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];

  const { data: classesResponse } = useClasses({ limit: 100 });
  const classes = classesResponse?.data || [];

  const { data: feesResponse, isLoading, error } = useQuery({
    queryKey: ['feeStructures', currentPage, itemsPerPage, searchTerm, selectedBranchId],
    queryFn: () => feeStructureService.getFeeStructures({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined
    })
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => feeStructureService.createFeeStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast({ title: 'Success', description: 'Fee structure created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create fee structure',
        variant: 'destructive'
      });
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return Promise.all(data.map(item => feeStructureService.createFeeStructure(item)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast({ title: 'Success', description: 'Fee structures created successfully for all classes' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create fee structures',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      feeStructureService.updateFeeStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast({ title: 'Success', description: 'Fee structure updated successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update fee structure',
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feeStructureService.deleteFeeStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast({ title: 'Success', description: 'Fee structure deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete fee structure',
        variant: 'destructive'
      });
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    feeType: 'tuition' as any,
    transportDistanceGroup: '' as any,
    distanceRange: '',
    isActive: true,
    academicYear: new Date().getFullYear().toString()
  });

  const resetForm = () => {
    setFormData({
      title: '',
      feeType: 'tuition',
      transportDistanceGroup: '',
      distanceRange: '',
      isActive: true,
      academicYear: new Date().getFullYear().toString()
    });
    setEditingFee(null);
    setClassAmounts({});
    setClassStaffDiscounts({});
  };

  const handleEdit = async (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      title: fee.title,
      feeType: fee.feeType,
      transportDistanceGroup: fee.transportDistanceGroup || '',
      distanceRange: fee.distanceRange || '',
      isActive: fee.isActive,
      academicYear: fee.academicYear
    });
    
    // Load all fee structures with same title/type/year to populate the grid
    try {
      const response = await feeStructureService.getFeeStructures({
        search: fee.title,
        branchId: user?.role === 'super_admin' ? selectedBranchId !== 'all' ? selectedBranchId : undefined : undefined
      });
      
      if (response.success) {
        const relatedFees = response.data.filter((f: FeeStructure) => 
          f.title === fee.title && 
          f.feeType === fee.feeType && 
          f.academicYear === fee.academicYear
        );
        
        const amounts: Record<string, string> = {};
        const discounts: Record<string, string> = {};
        
        relatedFees.forEach((f: FeeStructure) => {
          amounts[f.classId] = f.amount.toString();
          discounts[f.classId] = f.staffDiscountPercent?.toString() || '0';
        });
        
        setClassAmounts(amounts);
        setClassStaffDiscounts(discounts);
      }
    } catch (error) {
      console.error('Error loading related fees:', error);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build data for all classes with amounts
    const bulkData = classes
      .filter((cls: any) => classAmounts[cls._id] && parseFloat(classAmounts[cls._id]) > 0)
      .map((cls: any) => ({
        title: formData.title,
        feeType: formData.feeType,
        classId: cls._id,
        className: cls.name,
        amount: Number(classAmounts[cls._id]),
        staffDiscountPercent: classStaffDiscounts[cls._id] ? Number(classStaffDiscounts[cls._id]) : 0,
        transportDistanceGroup: formData.transportDistanceGroup || undefined,
        distanceRange: formData.distanceRange || undefined,
        isActive: formData.isActive,
        academicYear: formData.academicYear,
        branchId: user?.branchId || ''
      }));

    if (bulkData.length === 0) {
      toast({ title: 'Error', description: 'Please enter amounts for at least one class', variant: 'destructive' });
      return;
    }

    if (editingFee) {
      // For edit mode, delete old entries and create new ones
      try {
        // Find all related fee structures
        const response = await feeStructureService.getFeeStructures({
          search: editingFee.title,
          branchId: user?.role === 'super_admin' ? selectedBranchId !== 'all' ? selectedBranchId : undefined : undefined
        });
        
        if (response.success) {
          const relatedFees = response.data.filter((f: FeeStructure) => 
            f.title === editingFee.title && 
            f.feeType === editingFee.feeType && 
            f.academicYear === editingFee.academicYear
          );
          
          // Delete all related fees
          await Promise.all(relatedFees.map((f: FeeStructure) => 
            feeStructureService.deleteFeeStructure(f._id)
          ));
        }
        
        // Create new ones
        await Promise.all(bulkData.map(item => feeStructureService.createFeeStructure(item)));
        
        queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
        toast({ title: 'Success', description: 'Fee structures updated successfully' });
        setIsDialogOpen(false);
        resetForm();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update fee structures',
          variant: 'destructive'
        });
      }
    } else {
      // Create new
      bulkCreateMutation.mutate(bulkData);
    }
  };

  const fees = feesResponse?.data || [];
  const pagination = feesResponse?.pagination;

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load fee structures</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading && !fees.length) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Structures</h1>
            <p className="text-muted-foreground mt-1">Configure fee amounts for different classes</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'super_admin' && branches.length > 0 && (
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Fee Structure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingFee ? 'Edit' : 'Add'} Fee Structure
                  </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Fee Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Monthly Tuition Fee"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feeType">Fee Type *</Label>
                    <Select
                      value={formData.feeType}
                      onValueChange={(value) => setFormData({ ...formData, feeType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition Fee</SelectItem>
                        <SelectItem value="transport">Transport Fee</SelectItem>
                        <SelectItem value="cocurricular">Co-curricular Fee</SelectItem>
                        <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                        <SelectItem value="exam">Exam Fee</SelectItem>
                        <SelectItem value="textbook">Textbook Charges</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.feeType === 'transport' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="transportDistanceGroup">Distance Group *</Label>
                        <Select
                          value={formData.transportDistanceGroup}
                          onValueChange={(value) => setFormData({ ...formData, transportDistanceGroup: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="group1">Group 1</SelectItem>
                            <SelectItem value="group2">Group 2</SelectItem>
                            <SelectItem value="group3">Group 3</SelectItem>
                            <SelectItem value="group4">Group 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="distanceRange">Distance Range *</Label>
                        <Input
                          id="distanceRange"
                          value={formData.distanceRange}
                          onChange={e => setFormData({ ...formData, distanceRange: e.target.value })}
                          placeholder="e.g., 0-5 km"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year *</Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder="e.g., 2024"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                  </div>
                </div>

                {/* Show all classes with amount and staff discount inputs */}
                <div className="space-y-3 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <Label className="text-base font-semibold">Enter Amount and Discount for Each Class</Label>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Class</th>
                          <th className="text-left p-3 font-semibold">Amount (BHD) *</th>
                          <th className="text-left p-3 font-semibold">Staff Discount (%)</th>
                          <th className="text-left p-3 font-semibold">Discounted Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls: any) => {
                          const amount = parseFloat(classAmounts[cls._id] || '0');
                          const discount = parseFloat(classStaffDiscounts[cls._id] || '0');
                          const discountedAmount = amount > 0 && discount > 0 
                            ? amount - (amount * discount / 100)
                            : null;
                          
                          return (
                            <tr key={cls._id} className="border-b hover:bg-muted/30">
                              <td className="p-3">
                                <Label className="font-medium">{cls.name}</Label>
                              </td>
                              <td className="p-3">
                                <Input
                                  id={`amount-${cls._id}`}
                                  type="number"
                                  step="0.001"
                                  placeholder="0.000"
                                  className="max-w-[150px]"
                                  value={classAmounts[cls._id] || ''}
                                  onChange={(e) => setClassAmounts({ ...classAmounts, [cls._id]: e.target.value })}
                                  required
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  id={`discount-${cls._id}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  className="max-w-[120px]"
                                  value={classStaffDiscounts[cls._id] || ''}
                                  onChange={(e) => setClassStaffDiscounts({ ...classStaffDiscounts, [cls._id]: e.target.value })}
                                />
                              </td>
                              <td className="p-3">
                                {discountedAmount !== null ? (
                                  <span className="font-semibold text-green-600">BHD {discountedAmount.toFixed(3)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingFee ? 'Update All' : 'Create All'}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <DataTable
          searchPlaceholder="Search fee structures..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          pagination={{
            currentPage,
            totalPages: pagination?.pages || 1,
            totalItems: pagination?.total || 0,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: setItemsPerPage
          }}
          data={fees}
          isLoading={isLoading}
        >
          <div className="grid gap-4">
            {fees.map((fee: FeeStructure) => (
              <Card key={fee._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{fee.title}</h3>
                        {!fee.isActive && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium capitalize">{fee.feeType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <span className="ml-2 font-medium">{fee.className}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 font-semibold text-primary">BHD {fee.amount.toFixed(3)}</span>
                        </div>
                        {fee.staffDiscountPercent && fee.staffDiscountPercent > 0 && (
                          <div>
                            <span className="text-muted-foreground">Staff Discount:</span>
                            <span className="ml-2 font-medium text-green-600">{fee.staffDiscountPercent}%</span>
                          </div>
                        )}
                        {fee.distanceRange && (
                          <div>
                            <span className="text-muted-foreground">Distance:</span>
                            <span className="ml-2 font-medium">{fee.distanceRange}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Year:</span>
                          <span className="ml-2 font-medium">{fee.academicYear}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(fee)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(fee._id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>
      </div>
    </AppLayout>
  );
};

export default FeeStructures;
