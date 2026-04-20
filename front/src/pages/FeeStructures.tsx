import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import feeStructureService, { FeeStructure } from '@/services/feeStructureService';
import feeTypeConfigService, { FeeTypeConfig } from '@/services/feeTypeConfigService';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';
import { classesApi } from '@/services/classes';
import { useClasses } from '@/hooks/useClasses';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';

const FeeStructures = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Page-level branch filter (list view)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Branch selected inside the dialog (used for loading branch-specific fee types & classes)
  const [dialogBranchId, setDialogBranchId] = useState<string>('');

  const [classAmounts, setClassAmounts] = useState<Record<string, string>>({});
  const [classStaffDiscounts, setClassStaffDiscounts] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isSuperAdmin = (user?.role === 'platform_admin' || user?.role === 'org_admin');

  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];

  // Effective branch for data fetching inside dialog
  const effectiveBranchId = isSuperAdmin ? dialogBranchId : (user?.branchId || '');

  // Fee types — loaded only for the selected branch inside the dialog
  const { data: feeTypesResponse } = useQuery({
    queryKey: ['feeTypeConfigs', effectiveBranchId],
    queryFn: () => feeTypeConfigService.getFeeTypeConfigs({
      isActive: true,
      branchId: effectiveBranchId || undefined
    }),
    enabled: !!effectiveBranchId
  });
  const feeTypes: FeeTypeConfig[] = feeTypesResponse?.data || [];

  // Classes — loaded filtered by branch
  const { data: classesResponse } = useClasses({
    limit: 100,
    branchId: effectiveBranchId || undefined
  });
  const classes = classesResponse?.data || [];

  // Page-level fee structures list
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
    mutationFn: async (data: any[]) =>
      Promise.all(data.map(item => feeStructureService.createFeeStructure(item))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast({ title: 'Success', description: 'Fee structures created successfully' });
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
    feeTypeId: '',
    transportDistanceGroup: '' as any,
    distanceRange: '',
    isActive: true,
    academicYear: new Date().getFullYear().toString()
  });

  const selectedFeeType = feeTypes.find(ft => ft._id === formData.feeTypeId);
  const isCommon = selectedFeeType?.isCommon ?? false;

  const resetForm = () => {
    setFormData({
      title: '',
      feeTypeId: '',
      transportDistanceGroup: '',
      distanceRange: '',
      isActive: true,
      academicYear: new Date().getFullYear().toString()
    });
    setEditingFee(null);
    setDialogBranchId('');
    setClassAmounts({});
    setClassStaffDiscounts({});
  };

  // Populated fields from the API can be objects like { _id, name }. Extract the raw ID string.
  const toId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val._id) return String(val._id);
    return String(val);
  };

  const handleEdit = async (fee: FeeStructure) => {
    const branchId = isSuperAdmin ? toId(fee.branchId) : (user?.branchId || '');
    const feeTypeId = toId(fee.feeTypeId);
    const classParams = { limit: 100, branchId: branchId || undefined };

    // Prefetch fee types + classes + related amounts in parallel BEFORE opening dialog
    // so the dialog renders with data already in cache
    const [, , relatedResponse] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: ['feeTypeConfigs', branchId],
        queryFn: () => feeTypeConfigService.getFeeTypeConfigs({ isActive: true, branchId: branchId || undefined })
      }),
      queryClient.fetchQuery({
        queryKey: ['classes', classParams],
        queryFn: () => classesApi.getClasses(classParams)
      }),
      feeStructureService.getFeeStructures({
        search: fee.title,
        branchId: branchId || undefined
      })
    ]).catch(err => {
      console.error('Error prefetching edit data:', err);
      return [null, null, null];
    });

    const amounts: Record<string, string> = {};
    const discounts: Record<string, string> = {};

    if (relatedResponse?.success) {
      const relatedFees = relatedResponse.data.filter((f: FeeStructure) =>
        f.title === fee.title &&
        toId(f.feeTypeId) === feeTypeId &&
        f.academicYear === fee.academicYear
      );

      if (fee.isCommon) {
        const commonEntry = relatedFees[0];
        if (commonEntry) {
          amounts['common'] = commonEntry.amount.toString();
          discounts['common'] = commonEntry.staffDiscountPercent?.toString() || '0';
        }
      } else {
        relatedFees.forEach((f: FeeStructure) => {
          const clsId = toId(f.classId);
          if (clsId) {
            amounts[clsId] = f.amount.toString();
            discounts[clsId] = f.staffDiscountPercent?.toString() || '0';
          }
        });
      }
    }

    // Set all state at once — dialog opens with data already in cache
    setEditingFee(fee);
    setDialogBranchId(branchId);
    setFormData({
      title: fee.title,
      feeTypeId,
      transportDistanceGroup: fee.transportDistanceGroup || '',
      distanceRange: fee.distanceRange || '',
      isActive: fee.isActive,
      academicYear: fee.academicYear
    });
    setClassAmounts(amounts);
    setClassStaffDiscounts(discounts);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !dialogBranchId) {
      toast({ title: 'Error', description: 'Please select a branch first', variant: 'destructive' });
      return;
    }

    if (!formData.feeTypeId) {
      toast({ title: 'Error', description: 'Please select a fee type', variant: 'destructive' });
      return;
    }

    const feeTypeName = selectedFeeType?.name || '';
    const branchId = isSuperAdmin ? dialogBranchId : (user?.branchId || '');

    let bulkData: any[] = [];

    if (isCommon) {
      const amount = parseFloat(classAmounts['common'] || '0');
      if (!amount || amount <= 0) {
        toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
        return;
      }
      bulkData = [{
        title: formData.title,
        feeTypeId: formData.feeTypeId,
        feeTypeName,
        isCommon: true,
        amount,
        staffDiscountPercent: classStaffDiscounts['common'] ? Number(classStaffDiscounts['common']) : 0,
        transportDistanceGroup: formData.transportDistanceGroup || undefined,
        distanceRange: formData.distanceRange || undefined,
        isActive: formData.isActive,
        academicYear: formData.academicYear,
        branchId
      }];
    } else {
      bulkData = classes
        .filter((cls: any) => classAmounts[cls._id] && parseFloat(classAmounts[cls._id]) > 0)
        .map((cls: any) => ({
          title: formData.title,
          feeTypeId: formData.feeTypeId,
          feeTypeName,
          isCommon: false,
          classId: cls._id,
          className: cls.name,
          amount: Number(classAmounts[cls._id]),
          staffDiscountPercent: classStaffDiscounts[cls._id] ? Number(classStaffDiscounts[cls._id]) : 0,
          transportDistanceGroup: formData.transportDistanceGroup || undefined,
          distanceRange: formData.distanceRange || undefined,
          isActive: formData.isActive,
          academicYear: formData.academicYear,
          branchId
        }));

      if (bulkData.length === 0) {
        toast({ title: 'Error', description: 'Please enter amounts for at least one class', variant: 'destructive' });
        return;
      }
    }

    if (editingFee) {
      try {
        const editBranchId = toId(editingFee.branchId);
        const editFeeTypeId = toId(editingFee.feeTypeId);
        const response = await feeStructureService.getFeeStructures({
          search: editingFee.title,
          branchId: editBranchId || undefined
        });

        if (response.success) {
          const relatedFees = response.data.filter((f: FeeStructure) =>
            f.title === editingFee.title &&
            toId(f.feeTypeId) === editFeeTypeId &&
            f.academicYear === editingFee.academicYear
          );
          await Promise.all(relatedFees.map((f: FeeStructure) =>
            feeStructureService.deleteFeeStructure(f._id)
          ));
        }

        await Promise.all(bulkData.map(item => feeStructureService.createFeeStructure(item)));
        queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
        toast({ title: 'Success', description: 'Fee structures updated successfully' });
        setIsDialogOpen(false);
        resetForm();
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to update fee structures',
          variant: 'destructive'
        });
      }
    } else {
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
        {/* Page header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Fee Structures</h1>
            <p className="text-muted-foreground mt-1">Configure fee amounts for different classes</p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Page-level branch filter */}
            {isSuperAdmin && branches.length > 0 && (
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch._id} value={branch._id}>{branch.name}</SelectItem>
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
                  <DialogTitle>{editingFee ? 'Edit' : 'Add'} Fee Structure</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* ── Step 1: Branch (super_admin, create only) ── */}
                  {isSuperAdmin && !editingFee && (
                    <div className="space-y-2 pb-2 border-b">
                      <Label htmlFor="dialogBranch">Branch *</Label>
                      <Select
                        value={dialogBranchId}
                        onValueChange={(v) => {
                          setDialogBranchId(v);
                          // Reset fee type when branch changes
                          setFormData(prev => ({ ...prev, feeTypeId: '' }));
                          setClassAmounts({});
                          setClassStaffDiscounts({});
                        }}
                      >
                        <SelectTrigger id="dialogBranch">
                          <SelectValue placeholder="Select branch first..." />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch: any) => (
                            <SelectItem key={branch._id} value={branch._id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select a branch to load its fee types and classes.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Fee Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Annual Tuition Fee 2025"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feeType">Fee Type *</Label>
                      {/* Show hint if super_admin hasn't picked a branch yet */}
                      {isSuperAdmin && !dialogBranchId && !editingFee ? (
                        <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded px-3 py-2">
                          Select a branch above to load fee types.
                        </div>
                      ) : feeTypes.length === 0 ? (
                        <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded px-3 py-2">
                          No fee types found for this branch. Go to Master Data → Fee Types to add them.
                        </div>
                      ) : (
                        <Select
                          value={formData.feeTypeId}
                          onValueChange={(value) => setFormData({ ...formData, feeTypeId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {feeTypes.map(ft => (
                              <SelectItem key={ft._id} value={ft._id}>
                                {ft.name}
                                {ft.isCommon && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Common)</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {selectedFeeType && (
                        <p className="text-xs text-muted-foreground">
                          {isCommon
                            ? 'Common for all classes — enter a single amount below.'
                            : 'Per class — enter amounts for each class below.'}
                        </p>
                      )}
                    </div>

                    {/* Transport-specific fields */}
                    {selectedFeeType?.name?.toLowerCase().includes('transport') && (
                      <>
                        <div className="space-y-2">
                          <Label>Distance Group</Label>
                          <Select
                            value={formData.transportDistanceGroup}
                            onValueChange={(value) => setFormData({ ...formData, transportDistanceGroup: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select group (optional)" />
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
                          <Label htmlFor="distanceRange">Distance Range</Label>
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
                        placeholder="e.g., 2025"
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

                  {/* Amount grid — shown only once a fee type is selected */}
                  {formData.feeTypeId && (
                    <div className="space-y-3 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                      {isCommon ? (
                        <>
                          <Label className="text-base font-semibold">Amount (Common for All Classes)</Label>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-semibold">Amount (BHD) *</th>
                                <th className="text-left p-3 font-semibold">Staff Discount (%)</th>
                                <th className="text-left p-3 font-semibold">Discounted Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    step="0.001"
                                    placeholder="0.000"
                                    className="max-w-[150px]"
                                    value={classAmounts['common'] || ''}
                                    onChange={e => setClassAmounts({ common: e.target.value })}
                                    required
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    className="max-w-[120px]"
                                    value={classStaffDiscounts['common'] || ''}
                                    onChange={e => setClassStaffDiscounts({ common: e.target.value })}
                                  />
                                </td>
                                <td className="p-3">
                                  {(() => {
                                    const amt = parseFloat(classAmounts['common'] || '0');
                                    const disc = parseFloat(classStaffDiscounts['common'] || '0');
                                    const discounted = amt > 0 && disc > 0 ? amt - (amt * disc / 100) : null;
                                    return discounted !== null
                                      ? <span className="font-semibold text-green-600">BHD {discounted.toFixed(3)}</span>
                                      : <span className="text-muted-foreground">-</span>;
                                  })()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </>
                      ) : (
                        <>
                          <Label className="text-base font-semibold">Amount and Discount per Class</Label>
                          {classes.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No classes found for this branch.
                            </p>
                          ) : (
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
                                            type="number"
                                            step="0.001"
                                            placeholder="0.000"
                                            className="max-w-[150px]"
                                            value={classAmounts[cls._id] || ''}
                                            onChange={e => setClassAmounts({ ...classAmounts, [cls._id]: e.target.value })}
                                          />
                                        </td>
                                        <td className="p-3">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="0"
                                            className="max-w-[120px]"
                                            value={classStaffDiscounts[cls._id] || ''}
                                            onChange={e => setClassStaffDiscounts({ ...classStaffDiscounts, [cls._id]: e.target.value })}
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
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || bulkCreateMutation.isPending}
                    >
                      {(createMutation.isPending || bulkCreateMutation.isPending) && (
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

        {/* List */}
        <DataTable
          searchPlaceholder="Search fee structures..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          exportConfig={{
            filename: 'fee_structures',
            columns: pageConfigurations.feeStructures.exportColumns.map(col => ({
              ...col,
              formatter: col.formatter ? formatters[col.formatter] : undefined
            }))
          }}
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
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{fee.title}</h3>
                        {fee.isCommon && (
                          <Badge variant="secondary" className="text-xs">Common</Badge>
                        )}
                        {!fee.isActive && (
                          <Badge variant="destructive" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium">{fee.feeTypeName}</span>
                        </div>
                        {!fee.isCommon && (
                          <div>
                            <span className="text-muted-foreground">Class:</span>
                            <span className="ml-2 font-medium">{fee.className}</span>
                          </div>
                        )}
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
                      <Button size="sm" variant="outline" onClick={() => handleEdit(fee)}>
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
