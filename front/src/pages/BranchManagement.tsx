import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches';
import { useUsers } from '@/hooks/useUsers';
import { Branch, FeatureKey, FeatureRegistryItem } from '@/types';
import { Plus, Search, Edit, Trash2, Building, MapPin, Phone, Mail, User as UserIcon, Calendar, Loader2, Settings2, Save, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ExportButton } from '@/components/ui/export-button';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';
import { featureService } from '@/services/featureService';
import { useFeatureAccess } from '@/contexts/FeatureContext';

const BranchManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { user } = useAuth();
  const { refetch: refetchFeatures } = useFeatureAccess();

  // Feature settings dialog state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureBranch, setFeatureBranch] = useState<any>(null);
  const [featureRegistry, setFeatureRegistry] = useState<FeatureRegistryItem[]>([]);
  const [orgEnabledFeatures, setOrgEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [branchEnabledFeatures, setBranchEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSaving, setFeatureSaving] = useState(false);

  const openFeatureDialog = async (branch: any) => {
    setFeatureBranch(branch);
    setFeatureDialogOpen(true);
    setFeatureLoading(true);
    try {
      const [regRes, brRes] = await Promise.all([
        featureService.getRegistry(),
        featureService.getBranchFeatures(branch._id || branch.id),
      ]);
      setFeatureRegistry(regRes.data?.data || []);
      const data = brRes.data?.data;
      if (data) {
        setOrgEnabledFeatures(new Set(data.orgEnabledFeatures));
        setBranchEnabledFeatures(
          data.branchEnabledFeatures ? new Set(data.branchEnabledFeatures) : new Set(data.orgEnabledFeatures)
        );
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again feature settings', variant: 'destructive' });
    } finally {
      setFeatureLoading(false);
    }
  };

  const toggleBranchFeature = (key: FeatureKey) => {
    if (!orgEnabledFeatures.has(key)) return;
    setBranchEnabledFeatures((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const saveBranchFeatures = async () => {
    if (!featureBranch) return;
    setFeatureSaving(true);
    try {
      await featureService.updateBranchFeatures(
        featureBranch._id || featureBranch.id,
        [...branchEnabledFeatures] as FeatureKey[]
      );
      toast({ title: 'Success', description: 'Branch feature settings updated' });
      setFeatureDialogOpen(false);
      refetchFeatures();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again', variant: 'destructive' });
    } finally {
      setFeatureSaving(false);
    }
  };

  // API hooks
  const { data: branchesResponse, isLoading } = useBranches();
  const { data: usersResponse } = useUsers({ limit: 0 });
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const deleteBranchMutation = useDeleteBranch();

  const branches = branchesResponse?.data || [];
  const users = usersResponse?.data || [];
  const pagination = branchesResponse?.pagination;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    establishedDate: '',
    status: 'active' as 'active' | 'inactive',
    // Override fields (empty = inherit from organization)
    taxId: '',
    taxLabel: '',
    currency: '',
    currencySymbol: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    registrationNumber: '',
    footerText: '',
    website: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      principalName: '',
      establishedDate: '',
      status: 'active',
      taxId: '',
      taxLabel: '',
      currency: '',
      currencySymbol: '',
      country: '',
      state: '',
      city: '',
      pincode: '',
      registrationNumber: '',
      footerText: '',
      website: '',
    });
    setEditingBranch(null);
  };

  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
  };

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name,
      code: editingBranch ? formData.code : generateCode(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        await updateBranchMutation.mutateAsync({
          id: editingBranch._id,
          ...formData
        });
        toast({ title: 'Branch updated successfully' });
      } else {
        await createBranchMutation.mutateAsync(formData);
        toast({ title: 'Branch created successfully' });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Something went wrong while saving. Please try again branch',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      principalName: branch.principalName || '',
      establishedDate: branch.establishedDate,
      status: branch.status,
      taxId: branch.taxId || '',
      taxLabel: branch.taxLabel || '',
      currency: branch.currency || '',
      currencySymbol: branch.currencySymbol || '',
      country: branch.country || '',
      state: branch.state || '',
      city: branch.city || '',
      pincode: branch.pincode || '',
      registrationNumber: branch.registrationNumber || '',
      footerText: branch.footerText || '',
      website: branch.website || '',
    });
    setIsDialogOpen(true);
  };

  const resolveBranchId = (userBranchId: any) => {
    return userBranchId?._id || userBranchId?.id || userBranchId;
  };

  const handleDelete = async (id: string, branchName: string) => {
    // Check if branch has users
    const branchUsers = users.filter((u: any) => resolveBranchId(u.branchId) === id);
    if (branchUsers.length > 0) {
      toast({
        title: 'Cannot Delete Branch',
        description: `This branch has ${branchUsers.length} users. Please reassign or remove users first.`,
        variant: 'destructive'
      });
      return;
    }

    confirm(
      {
        title: 'Delete Branch',
        description: `Are you sure you want to delete "${branchName}"? This action cannot be undone and will remove all branch data.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      async () => {
        try {
          await deleteBranchMutation.mutateAsync(id);
          toast({ title: 'Branch deleted successfully' });
        } catch (error: any) {
          toast({ 
            title: 'Error', 
            description: error.response?.data?.message || 'Something went wrong while deleting. Please try again branch',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const getBranchStats = (branchId: string) => {
    const branchUsers = users.filter((u: any) => resolveBranchId(u.branchId) === branchId);
    return {
      totalUsers: branchUsers.length,
      admins: branchUsers.filter((u: any) => u.role === 'branch_admin').length,
      teachers: branchUsers.filter((u: any) => u.role === 'teacher').length,
      staff: branchUsers.filter((u: any) => u.role === 'staff').length,
    };
  };

  const filteredBranches = branches.filter((b: any) => {
    const matchSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.principalName && b.principalName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Only super admin can access this page
  if ((user?.role !== 'platform_admin' && user?.role !== 'org_admin')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <CardContent>
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only Super Admins can manage branches.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Branch Management</h1>
            <p className="text-muted-foreground mt-1">Manage multiple school branches</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingBranch ? 'Update branch information below.' : 'Fill in the details to create a new branch.'}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Main Campus, North Branch"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Branch Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., MAIN, NORTH"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Branch contact number"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="branch@school.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="principalName">Principal Name</Label>
                    <Input
                      id="principalName"
                      placeholder="Principal's full name"
                      value={formData.principalName}
                      onChange={e => setFormData({ ...formData, principalName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="establishedDate">Established Date *</Label>
                    <Input
                      id="establishedDate"
                      type="date"
                      value={formData.establishedDate}
                      onChange={e => setFormData({ ...formData, establishedDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Complete branch address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
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

                {/* Override Settings */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-1">Settings Override</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Leave empty to inherit from organization defaults.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="b-currency">Currency Code</Label>
                      <Select
                        value={formData.currency || '__inherit__'}
                        onValueChange={(value) => {
                          if (value === '__inherit__') {
                            setFormData({ ...formData, currency: '', currencySymbol: '' });
                          } else {
                            const symbols: Record<string, string> = { BHD: 'BD', INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SAR: 'SAR', KWD: 'KD', OMR: 'OMR', QAR: 'QAR' };
                            setFormData({ ...formData, currency: value, currencySymbol: symbols[value] || value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Inherit from org" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__inherit__">Inherit from organization</SelectItem>
                          <SelectItem value="BHD">BHD - Bahraini Dinar</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                          <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                          <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                          <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-currencySymbol">Currency Symbol</Label>
                      <Input
                        id="b-currencySymbol"
                        placeholder="Inherit from org"
                        value={formData.currencySymbol}
                        onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-taxLabel">Tax Label</Label>
                      <Input
                        id="b-taxLabel"
                        placeholder="Inherit from org"
                        value={formData.taxLabel}
                        onChange={e => setFormData({ ...formData, taxLabel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-taxId">Tax / Registration Number</Label>
                      <Input
                        id="b-taxId"
                        placeholder="Inherit from org"
                        value={formData.taxId}
                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-country">Country</Label>
                      <Input
                        id="b-country"
                        placeholder="Inherit from org"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-state">State / Province</Label>
                      <Input
                        id="b-state"
                        placeholder="Inherit from org"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-city">City</Label>
                      <Input
                        id="b-city"
                        placeholder="Inherit from org"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-pincode">PIN / ZIP Code</Label>
                      <Input
                        id="b-pincode"
                        placeholder="Inherit from org"
                        value={formData.pincode}
                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-website">Website</Label>
                      <Input
                        id="b-website"
                        placeholder="Inherit from org"
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-registrationNumber">Registration Number</Label>
                      <Input
                        id="b-registrationNumber"
                        placeholder="Inherit from org"
                        value={formData.registrationNumber}
                        onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-footerText">Receipt Footer Text</Label>
                    <Input
                      id="b-footerText"
                      placeholder="Inherit from org"
                      value={formData.footerText}
                      onChange={e => setFormData({ ...formData, footerText: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBranch ? 'Update' : 'Create'} Branch
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {branches.filter((b: any) => b.status === 'active').length} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {users.filter((u: any) => u.branchId).length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across all branches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Branch Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {users.filter((u: any) => u.role === 'branch_admin').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Managing branches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Newest Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {branches.length > 0 
                  ? branches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].name
                  : 'None'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-2">Latest addition</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, code, address, or principal..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus || '__all__'} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <ExportButton
                data={filteredBranches}
                filename="branches"
                columns={pageConfigurations.branches.exportColumns.map(col => ({
                  ...col,
                  formatter: col.formatter ? formatters[col.formatter] : undefined
                }))}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredBranches.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No branches found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">Branch Name</th>
                        <th className="text-left p-4 font-semibold">Code</th>
                        <th className="text-left p-4 font-semibold">Address</th>
                        <th className="text-left p-4 font-semibold">Contact</th>
                        <th className="text-left p-4 font-semibold">Principal</th>
                        <th className="text-left p-4 font-semibold">Users</th>
                        <th className="text-left p-4 font-semibold">Status</th>
                        <th className="text-left p-4 font-semibold">Established</th>
                        <th className="text-right p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBranches.map(branch => {
                        const stats = getBranchStats(branch.id);
                        return (
                          <tr key={branch.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-medium">{branch.name}</td>
                            <td className="p-4">
                              <Badge variant="outline" className="font-mono">
                                {branch.code}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm">
                              <div className="flex items-start gap-1">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <span>{branch.address}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <span>{branch.phone}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-muted-foreground" />
                                  <span>{branch.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">
                              {branch.principalName ? (
                                <div className="flex items-center gap-1">
                                  <UserIcon className="w-3 h-3 text-muted-foreground" />
                                  <span>{branch.principalName}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                            <td className="p-4 text-sm">
                              <div className="space-y-0.5">
                                <div>Total: {stats.totalUsers}</div>
                                <div className="text-xs text-muted-foreground">
                                  A:{stats.admins} T:{stats.teachers} S:{stats.staff}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                                {branch.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span>{new Date(branch.establishedDate).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="outline" title="Feature Settings" onClick={() => openFeatureDialog(branch)}>
                                  <Settings2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(branch)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(branch.id, branch.name)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmationComponent />

      {/* Feature Settings Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Feature Settings — {featureBranch?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Toggle features for this branch. Features disabled at the organization level cannot be enabled here.
            </p>
          </DialogHeader>
          {featureLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{branchEnabledFeatures.size}/{orgEnabledFeatures.size} available</Badge>
                <Button size="sm" variant="outline" onClick={() => setBranchEnabledFeatures(new Set(orgEnabledFeatures))}>
                  Reset to Org Defaults
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featureRegistry.map((feature) => {
                  const isOrgEnabled = orgEnabledFeatures.has(feature.key);
                  const isBranchEnabled = branchEnabledFeatures.has(feature.key);
                  return (
                    <div
                      key={feature.key}
                      className={`flex items-start justify-between rounded-lg border p-3 transition-colors ${
                        !isOrgEnabled
                          ? 'border-border bg-muted/50 opacity-60'
                          : isBranchEnabled
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="space-y-0.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{feature.label}</span>
                          {!isOrgEnabled ? (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Lock className="h-2.5 w-2.5" /> Not in plan
                            </Badge>
                          ) : (
                            <Badge variant={isBranchEnabled ? 'default' : 'secondary'} className="text-[10px]">
                              {isBranchEnabled ? 'ON' : 'OFF'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                        checked={isBranchEnabled}
                        onCheckedChange={() => toggleBranchFeature(feature.key)}
                        disabled={!isOrgEnabled}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveBranchFeatures} disabled={featureSaving}>
                  {featureSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default BranchManagement;