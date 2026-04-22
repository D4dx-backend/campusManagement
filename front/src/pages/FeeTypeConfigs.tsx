import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import feeTypeConfigService, { FeeTypeConfig } from '@/services/feeTypeConfigService';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { ExportButton } from '@/components/ui/export-button';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const FeeTypeConfigs = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<FeeTypeConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Page-level branch filter (for listing)
  const [filterBranchId, setFilterBranchId] = useState<string>('all');

  // Branch selection used inside the create/edit dialog (super_admin only)
  const [dialogBranchId, setDialogBranchId] = useState<string>('');

  const [formData, setFormData] = useState({ name: '', isCommon: false, isActive: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];

  const isSuperAdmin = (user?.role === 'platform_admin' || user?.role === 'org_admin');

  const { data, isLoading, error } = useQuery({
    queryKey: ['feeTypeConfigs', filterBranchId],
    queryFn: () => feeTypeConfigService.getFeeTypeConfigs({
      branchId: filterBranchId !== 'all' ? filterBranchId : undefined
    })
  });

  const feeTypes: FeeTypeConfig[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (d: any) => feeTypeConfigService.createFeeTypeConfig(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeTypeConfigs'] });
      toast({ title: 'Success', description: 'Fee type created successfully' });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while creating. Please try again fee type', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      feeTypeConfigService.updateFeeTypeConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeTypeConfigs'] });
      toast({ title: 'Success', description: 'Fee type updated successfully' });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while updating. Please try again fee type', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feeTypeConfigService.deleteFeeTypeConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeTypeConfigs'] });
      toast({ title: 'Success', description: 'Fee type deleted successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while deleting. Please try again fee type', variant: 'destructive' });
    }
  });

  const openCreate = () => {
    setEditingType(null);
    setFormData({ name: '', isCommon: false, isActive: true });
    setDialogBranchId('');
    setIsDialogOpen(true);
  };

  const openEdit = (ft: FeeTypeConfig) => {
    setEditingType(ft);
    setFormData({ name: ft.name, isCommon: ft.isCommon, isActive: ft.isActive });
    setDialogBranchId(ft.branchId || '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    setFormData({ name: '', isCommon: false, isActive: true });
    setDialogBranchId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !dialogBranchId) {
      toast({ title: 'Error', description: 'Please select a branch', variant: 'destructive' });
      return;
    }

    if (editingType) {
      updateMutation.mutate({ id: editingType._id, data: formData });
    } else {
      const payload: any = { ...formData };
      if (isSuperAdmin) payload.branchId = dialogBranchId;
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this fee type? This may affect existing fee structures.')) {
      deleteMutation.mutate(id);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Fee Types</h1>
            <p className="text-muted-foreground mt-1">Manage fee categories used in fee structures</p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButton
              data={feeTypes}
              filename="fee_types"
              columns={pageConfigurations.feeTypeConfigs.exportColumns.map(col => ({
                ...col,
                formatter: col.formatter ? formatters[col.formatter] : undefined
              }))}
            />

            {/* Page-level filter for super_admin */}
            {isSuperAdmin && branches.length > 0 && (
              <Select value={filterBranchId} onValueChange={setFilterBranchId}>
                <SelectTrigger className="w-[180px]">
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

            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={openCreate}>
                  <Plus className="w-4 h-4" />
                  Add Fee Type
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingType ? 'Edit' : 'Add'} Fee Type</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Branch selector — only shown to super_admin on create */}
                  {isSuperAdmin && !editingType && (
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch *</Label>
                      <Select value={dialogBranchId} onValueChange={setDialogBranchId}>
                        <SelectTrigger id="branch">
                          <SelectValue placeholder="Select a branch..." />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch: any) => (
                            <SelectItem key={branch._id} value={branch._id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Fee types are branch-specific.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Fee Type Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Admission Fee, Tuition Fee"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will appear in the fee structure dropdown and on receipts.
                    </p>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                    <div className="flex flex-col gap-1 flex-1">
                      <Label htmlFor="isCommon" className="font-medium">Common for All Classes</Label>
                      <p className="text-xs text-muted-foreground">
                        If enabled, one amount applies to all classes (e.g., Admission Fee).
                        If disabled, amounts are set per class.
                      </p>
                    </div>
                    <Switch
                      id="isCommon"
                      checked={formData.isCommon}
                      onCheckedChange={v => setFormData({ ...formData, isCommon: v })}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={v => setFormData({ ...formData, isActive: v })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingType ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-destructive">Failed to load fee types.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : feeTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Tags className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No fee types configured yet.</p>
              <p className="text-sm text-muted-foreground">
                Create fee types like "Admission Fee", "Tuition Fee", "Transport Fee", etc.
              </p>
              <Button className="mt-2 gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" />
                Add First Fee Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Search fee types..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {feeTypes.filter(ft => !searchTerm || ft.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ft) => (
              <Card key={ft._id} className={!ft.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="font-semibold truncate">{ft.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ft.isCommon ? (
                          <Badge variant="secondary" className="text-xs">Common (All Classes)</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Per Class</Badge>
                        )}
                        {!ft.isActive && (
                          <Badge variant="destructive" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(ft)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(ft._id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FeeTypeConfigs;
