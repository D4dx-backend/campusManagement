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
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from '@/hooks/useOrganizations';
import { Plus, Search, Edit, Trash2, Building, Phone, Mail, Globe, Loader2, Settings2, Save, RefreshCw, Star, CheckCircle, AlertCircle, Clock, GitBranch, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ExportButton } from '@/components/ui/export-button';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';
import { featureService } from '@/services/featureService';
import { FeatureKey, FeatureRegistryItem, ALL_FEATURE_KEYS } from '@/types';
import { domainService, DomainMapping } from '@/services/domainService';
import { apiClient } from '@/lib/api';

const OrganizationManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { user } = useAuth();

  // Feature settings dialog state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureOrg, setFeatureOrg] = useState<any>(null);
  const [featureRegistry, setFeatureRegistry] = useState<FeatureRegistryItem[]>([]);
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSaving, setFeatureSaving] = useState(false);

  const openFeatureDialog = async (org: any) => {
    setFeatureOrg(org);
    setFeatureDialogOpen(true);
    setFeatureLoading(true);
    try {
      const [regRes, orgRes] = await Promise.all([
        featureService.getRegistry(),
        featureService.getOrgFeatures(org._id || org.id),
      ]);
      setFeatureRegistry(regRes.data?.data || []);
      if (orgRes.data?.data?.enabledFeatures) {
        setEnabledFeatures(new Set(orgRes.data.data.enabledFeatures));
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again feature settings', variant: 'destructive' });
    } finally {
      setFeatureLoading(false);
    }
  };

  const toggleFeature = (key: FeatureKey) => {
    setEnabledFeatures((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const saveFeatures = async () => {
    if (!featureOrg) return;
    setFeatureSaving(true);
    try {
      await featureService.updateOrgFeatures(featureOrg._id || featureOrg.id, [...enabledFeatures] as FeatureKey[]);
      toast({ title: 'Success', description: 'Feature settings updated' });
      setFeatureDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again', variant: 'destructive' });
    } finally {
      setFeatureSaving(false);
    }
  };

  // ── Domain Management Dialog State ──
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [domainOrg, setDomainOrg] = useState<any>(null);
  const [domainList, setDomainList] = useState<DomainMapping[]>([]);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainForm, setDomainForm] = useState({ domain: '', domainType: 'subdomain' as 'subdomain' | 'custom', isPrimary: false });
  const [domainAdding, setDomainAdding] = useState(false);
  const [showAddDomain, setShowAddDomain] = useState(false);

  const loadDomains = async (orgId: string) => {
    setDomainLoading(true);
    try {
      const list = await domainService.getDomains(orgId);
      setDomainList(list);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again domains', variant: 'destructive' });
    } finally {
      setDomainLoading(false);
    }
  };

  const openDomainDialog = (org: any) => {
    setDomainOrg(org);
    setDomainDialogOpen(true);
    setShowAddDomain(false);
    setDomainForm({ domain: '', domainType: 'subdomain', isPrimary: false });
    loadDomains(org._id || org.id);
  };

  const handleAddDomain = async () => {
    if (!domainForm.domain.trim() || !domainOrg) return;
    setDomainAdding(true);
    try {
      await domainService.createDomain({
        domain: domainForm.domain.trim(),
        domainType: domainForm.domainType,
        organizationId: domainOrg._id || domainOrg.id,
        isPrimary: domainForm.isPrimary,
      });
      toast({ title: 'Domain added successfully' });
      setDomainForm({ domain: '', domainType: 'subdomain', isPrimary: false });
      setShowAddDomain(false);
      loadDomains(domainOrg._id || domainOrg.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while adding the domain. Please try again.', variant: 'destructive' });
    } finally {
      setDomainAdding(false);
    }
  };

  const handleDeleteDomain = async (d: DomainMapping) => {
    confirm(
      { title: 'Delete Domain', description: `Remove "${d.domain}"? Users accessing this domain will be affected.`, confirmText: 'Delete', variant: 'destructive' },
      async () => {
        try {
          await domainService.deleteDomain(d._id);
          toast({ title: 'Domain removed' });
          if (domainOrg) loadDomains(domainOrg._id || domainOrg.id);
        } catch (err: any) {
          toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while deleting. Please try again', variant: 'destructive' });
        }
      }
    );
  };

  const handleVerifyDomain = async (d: DomainMapping) => {
    try {
      const result = await domainService.verifyDomain(d._id);
      toast({ title: result.success ? 'Domain verified!' : 'Verification failed', description: result.message, variant: result.success ? 'default' : 'destructive' });
      if (domainOrg) loadDomains(domainOrg._id || domainOrg.id);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Verification failed', variant: 'destructive' });
    }
  };

  const handleSetPrimary = async (d: DomainMapping) => {
    try {
      await domainService.updateDomain(d._id, { isPrimary: true });
      toast({ title: 'Primary domain updated' });
      if (domainOrg) loadDomains(domainOrg._id || domainOrg.id);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Something went wrong while updating. Please try again', variant: 'destructive' });
    }
  };

  const getDomainStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
      active: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Active' },
      inactive: { icon: AlertCircle, color: 'text-gray-500 bg-gray-50', label: 'Inactive' },
      pending_verification: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'Pending' },
    };
    const c = config[status] || config.inactive;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${c.color}`}>
        <Icon className="w-3 h-3" />{c.label}
      </span>
    );
  };

  // ── Branch Management Dialog State ──
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchOrg, setBranchOrg] = useState<any>(null);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchFormOpen, setBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    name: '', code: '', address: '', phone: '', email: '',
    principalName: '', establishedDate: '', status: 'active' as 'active' | 'inactive',
  });

  // Branch feature dialog state
  const [branchFeatureDialogOpen, setBranchFeatureDialogOpen] = useState(false);
  const [branchFeatureTarget, setBranchFeatureTarget] = useState<any>(null);
  const [branchFeatureRegistry, setBranchFeatureRegistry] = useState<FeatureRegistryItem[]>([]);
  const [branchOrgFeatures, setBranchOrgFeatures] = useState<Set<FeatureKey>>(new Set());
  const [branchEnabledFeatures, setBranchEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [branchFeatureLoading, setBranchFeatureLoading] = useState(false);
  const [branchFeatureSaving, setBranchFeatureSaving] = useState(false);

  const loadBranches = async (orgId: string) => {
    setBranchLoading(true);
    try {
      const res = await apiClient.get<any[]>('/branches', { organizationId: orgId, limit: 100 });
      setBranchList(res.data?.data || []);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again branches', variant: 'destructive' });
    } finally {
      setBranchLoading(false);
    }
  };

  const openBranchDialog = (org: any) => {
    setBranchOrg(org);
    setBranchDialogOpen(true);
    setBranchFormOpen(false);
    setEditingBranch(null);
    loadBranches(org._id || org.id);
  };

  const resetBranchForm = () => {
    setBranchFormData({ name: '', code: '', address: '', phone: '', email: '', principalName: '', establishedDate: '', status: 'active' });
    setEditingBranch(null);
  };

  const openBranchForm = (branch?: any) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchFormData({
        name: branch.name, code: branch.code, address: branch.address,
        phone: branch.phone, email: branch.email, principalName: branch.principalName || '',
        establishedDate: branch.establishedDate ? branch.establishedDate.substring(0, 10) : '',
        status: branch.status,
      });
    } else {
      resetBranchForm();
    }
    setBranchFormOpen(true);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchOrg) return;
    setBranchSaving(true);
    const orgId = branchOrg._id || branchOrg.id;
    try {
      if (editingBranch) {
        await apiClient.put(`/branches/${editingBranch._id || editingBranch.id}`, { ...branchFormData, organizationId: orgId });
        toast({ title: 'Branch updated' });
      } else {
        await apiClient.post('/branches', { ...branchFormData, organizationId: orgId });
        toast({ title: 'Branch created' });
      }
      setBranchFormOpen(false);
      resetBranchForm();
      loadBranches(orgId);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again branch', variant: 'destructive' });
    } finally {
      setBranchSaving(false);
    }
  };

  const handleBranchDelete = (branch: any) => {
    confirm(
      { title: 'Delete Branch', description: `Delete "${branch.name}"? This removes all branch data.`, confirmText: 'Delete', variant: 'destructive' },
      async () => {
        try {
          await apiClient.delete(`/branches/${branch._id || branch.id}`);
          toast({ title: 'Branch deleted' });
          if (branchOrg) loadBranches(branchOrg._id || branchOrg.id);
        } catch (err: any) {
          toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while deleting. Please try again', variant: 'destructive' });
        }
      }
    );
  };

  const openBranchFeatureDialog = async (branch: any) => {
    setBranchFeatureTarget(branch);
    setBranchFeatureDialogOpen(true);
    setBranchFeatureLoading(true);
    try {
      const [regRes, brRes] = await Promise.all([
        featureService.getRegistry(),
        featureService.getBranchFeatures(branch._id || branch.id),
      ]);
      setBranchFeatureRegistry(regRes.data?.data || []);
      const data = brRes.data?.data;
      if (data) {
        setBranchOrgFeatures(new Set(data.orgEnabledFeatures));
        setBranchEnabledFeatures(data.branchEnabledFeatures ? new Set(data.branchEnabledFeatures) : new Set(data.orgEnabledFeatures));
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again feature settings', variant: 'destructive' });
    } finally {
      setBranchFeatureLoading(false);
    }
  };

  const toggleBranchFeature = (key: FeatureKey) => {
    if (!branchOrgFeatures.has(key)) return;
    setBranchEnabledFeatures((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const saveBranchFeatures = async () => {
    if (!branchFeatureTarget) return;
    setBranchFeatureSaving(true);
    try {
      await featureService.updateBranchFeatures(branchFeatureTarget._id || branchFeatureTarget.id, [...branchEnabledFeatures] as FeatureKey[]);
      toast({ title: 'Success', description: 'Branch features updated' });
      setBranchFeatureDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again', variant: 'destructive' });
    } finally {
      setBranchFeatureSaving(false);
    }
  };

  const { data: orgsResponse, isLoading } = useOrganizations();
  const createOrgMutation = useCreateOrganization();
  const updateOrgMutation = useUpdateOrganization();
  const deleteOrgMutation = useDeleteOrganization();

  const organizations = orgsResponse?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    status: 'active' as 'active' | 'inactive',
    subscriptionPlan: '',
    maxBranches: 10,
    taxId: '',
    taxLabel: 'GST',
    currency: 'BHD',
    currencySymbol: 'BD',
    country: '',
    state: '',
    city: '',
    pincode: '',
    registrationNumber: '',
    footerText: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      status: 'active',
      subscriptionPlan: '',
      maxBranches: 10,
      taxId: '',
      taxLabel: 'GST',
      currency: 'BHD',
      currencySymbol: 'BD',
      country: '',
      state: '',
      city: '',
      pincode: '',
      registrationNumber: '',
      footerText: '',
    });
    setEditingOrg(null);
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
      code: editingOrg ? formData.code : generateCode(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingOrg) {
        await updateOrgMutation.mutateAsync({
          id: editingOrg._id || editingOrg.id,
          ...formData,
        });
        toast({ title: 'Organization updated successfully' });
      } else {
        await createOrgMutation.mutateAsync(formData);
        toast({ title: 'Organization created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while saving. Please try again organization',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (org: any) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      code: org.code,
      address: org.address,
      phone: org.phone,
      email: org.email,
      website: org.website || '',
      status: org.status,
      subscriptionPlan: org.subscriptionPlan || '',
      maxBranches: org.maxBranches || 10,
      taxId: org.taxId || '',
      taxLabel: org.taxLabel || 'GST',
      currency: org.currency || 'BHD',
      currencySymbol: org.currencySymbol || 'BD',
      country: org.country || '',
      state: org.state || '',
      city: org.city || '',
      pincode: org.pincode || '',
      registrationNumber: org.registrationNumber || '',
      footerText: org.footerText || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, orgName: string) => {
    confirm(
      {
        title: 'Delete Organization',
        description: `Are you sure you want to delete "${orgName}"? This action cannot be undone and will remove all organization data.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          await deleteOrgMutation.mutateAsync(id);
          toast({ title: 'Organization deleted successfully' });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Something went wrong while deleting. Please try again organization',
            variant: 'destructive',
          });
        }
      }
    );
  };

  const filteredOrgs = organizations.filter((o: any) => {
    const matchSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (user?.role !== 'platform_admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <CardContent>
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only Platform Admins can manage organizations.</p>
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
            <h1 className="text-3xl font-bold">Organization Management</h1>
            <p className="text-muted-foreground mt-1">Manage organizations and their settings</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create New Organization'}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingOrg ? 'Update organization information below.' : 'Fill in the details to create a new organization.'}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., ABC Education Group"
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Organization Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., ABCEDU"
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
                      placeholder="Contact number"
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
                      placeholder="org@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBranches">Max Branches</Label>
                    <Input
                      id="maxBranches"
                      type="number"
                      min={1}
                      value={formData.maxBranches}
                      onChange={e => setFormData({ ...formData, maxBranches: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                    <Select
                      value={formData.subscriptionPlan}
                      onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Complete organization address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                {/* Business Settings */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-3">Business Settings</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    These are default settings for all branches. Branches can override them individually.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency Code</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => {
                          const symbols: Record<string, string> = { BHD: 'BD', INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SAR: 'SAR', KWD: 'KD', OMR: 'OMR', QAR: 'QAR' };
                          setFormData({ ...formData, currency: value, currencySymbol: symbols[value] || value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BHD">BHD - Bahraini Dinar</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                          <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                          <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                          <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currencySymbol">Currency Symbol</Label>
                      <Input
                        id="currencySymbol"
                        placeholder="e.g., BD, ₹, $"
                        value={formData.currencySymbol}
                        onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxLabel">Tax Label</Label>
                      <Input
                        id="taxLabel"
                        placeholder="e.g., GST, VAT, TRN"
                        value={formData.taxLabel}
                        onChange={e => setFormData({ ...formData, taxLabel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax / Registration Number</Label>
                      <Input
                        id="taxId"
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        value={formData.taxId}
                        onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="e.g., Bahrain"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        placeholder="State or province"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN / ZIP Code</Label>
                      <Input
                        id="pincode"
                        placeholder="Postal code"
                        value={formData.pincode}
                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">Registration Number</Label>
                      <Input
                        id="registrationNumber"
                        placeholder="e.g., CR-12345"
                        value={formData.registrationNumber}
                        onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footerText">Receipt Footer Text</Label>
                    <Input
                      id="footerText"
                      placeholder="e.g., Thank you for your payment"
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
                    {editingOrg ? 'Update' : 'Create'} Organization
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {organizations.filter((o: any) => o.status === 'active').length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {organizations.filter((o: any) => o.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">
                {organizations.filter((o: any) => o.status === 'inactive').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, code, or email..."
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
                data={filteredOrgs}
                filename="organizations"
                columns={pageConfigurations.organizations.exportColumns.map(col => ({
                  ...col,
                  formatter: col.formatter ? formatters[col.formatter] : undefined
                }))}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrgs.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No organizations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">Organization</th>
                        <th className="text-left p-4 font-semibold">Code</th>
                        <th className="text-left p-4 font-semibold">Contact</th>
                        <th className="text-left p-4 font-semibold">Plan</th>
                        <th className="text-left p-4 font-semibold">Currency</th>
                        <th className="text-left p-4 font-semibold">Max Branches</th>
                        <th className="text-left p-4 font-semibold">Status</th>
                        <th className="text-right p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrgs.map((org: any) => (
                        <tr key={org.id || org._id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-medium">{org.name}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="font-mono">{org.code}</Badge>
                          </td>
                          <td className="p-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span>{org.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span>{org.email}</span>
                              </div>
                              {org.website && (
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-muted-foreground" />
                                  <span>{org.website}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{org.subscriptionPlan || 'N/A'}</Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{org.currency || 'BHD'} ({org.currencySymbol || 'BD'})</span>
                          </td>
                          <td className="p-4 text-center">{org.maxBranches || '-'}</td>
                          <td className="p-4">
                            <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                              {org.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" title="Branches" onClick={() => openBranchDialog(org)}>
                                <GitBranch className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Domains" onClick={() => openDomainDialog(org)}>
                                <Globe className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Feature Settings" onClick={() => openFeatureDialog(org)}>
                                <Settings2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Edit" onClick={() => handleEdit(org)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Delete" onClick={() => handleDelete(org.id || org._id, org.name)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
              Feature Settings — {featureOrg?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Toggle features on/off for this organization. Changes affect all branches.
            </p>
          </DialogHeader>
          {featureLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{enabledFeatures.size}/{featureRegistry.length} enabled</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEnabledFeatures(new Set(ALL_FEATURE_KEYS))}>Enable All</Button>
                  <Button size="sm" variant="outline" onClick={() => setEnabledFeatures(new Set())}>Disable All</Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featureRegistry.map((feature) => (
                  <div
                    key={feature.key}
                    className={`flex items-start justify-between rounded-lg border p-3 transition-colors ${
                      enabledFeatures.has(feature.key) ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="space-y-0.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{feature.label}</span>
                        <Badge variant={enabledFeatures.has(feature.key) ? 'default' : 'secondary'} className="text-[10px]">
                          {enabledFeatures.has(feature.key) ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    <Switch
                      checked={enabledFeatures.has(feature.key)}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveFeatures} disabled={featureSaving}>
                  {featureSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Domain Management Dialog */}
      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domains — {domainOrg?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Manage domain mappings for this organization. Users accessing these domains will see this org's branding.
            </p>
          </DialogHeader>

          {domainLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Domain list */}
              {domainList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No domains configured for this organization</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {domainList.map((d) => (
                    <div key={d._id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{d.domain}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.domainType === 'subdomain' ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'}`}>
                              {d.domainType === 'subdomain' ? 'Sub' : 'Custom'}
                            </span>
                            {d.isPrimary && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getDomainStatusBadge(d.status)}
                            <span className={`text-[10px] ${d.sslStatus === 'active' ? 'text-green-600' : d.sslStatus === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                              SSL: {d.sslStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!d.isPrimary && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => handleSetPrimary(d)}>
                            Set Primary
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Verify DNS" onClick={() => handleVerifyDomain(d)}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => handleDeleteDomain(d)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Domain Section */}
              {showAddDomain ? (
                <div className="border rounded-lg p-4 mt-3 space-y-3 bg-muted/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Domain Type</Label>
                      <Select
                        value={domainForm.domainType}
                        onValueChange={(v) => setDomainForm((f) => ({ ...f, domainType: v as 'subdomain' | 'custom' }))}
                      >
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subdomain">Subdomain</SelectItem>
                          <SelectItem value="custom">Custom Domain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Domain</Label>
                      <Input
                        className="h-9"
                        value={domainForm.domain}
                        onChange={(e) => setDomainForm((f) => ({ ...f, domain: e.target.value }))}
                        placeholder={domainForm.domainType === 'subdomain' ? 'school.campuswise.in' : 'www.myschool.edu'}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="addDomainPrimary"
                      checked={domainForm.isPrimary}
                      onChange={(e) => setDomainForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="addDomainPrimary" className="text-xs font-normal">Set as primary domain</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddDomain(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleAddDomain} disabled={!domainForm.domain.trim() || domainAdding}>
                      {domainAdding ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      Add Domain
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full mt-3" onClick={() => setShowAddDomain(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Domain
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Branch Management Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Branches — {branchOrg?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Manage branches for this organization. Max: {branchOrg?.maxBranches || 10}
            </p>
          </DialogHeader>

          {branchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Branch list */}
              {branchList.length === 0 && !branchFormOpen ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No branches yet</p>
                </div>
              ) : !branchFormOpen && (
                <div className="space-y-2">
                  {branchList.map((branch: any) => (
                    <div key={branch._id || branch.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{branch.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px]">{branch.code}</Badge>
                          <Badge variant={branch.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {branch.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{branch.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{branch.email}</span>
                          {branch.principalName && (
                            <span className="flex items-center gap-1"><Building className="w-3 h-3" />{branch.principalName}</span>
                          )}
                          {branch.establishedDate && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(branch.establishedDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {branch.address && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{branch.address}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Feature Settings" onClick={() => openBranchFeatureDialog(branch)}>
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit" onClick={() => openBranchForm(branch)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" title="Delete" onClick={() => handleBranchDelete(branch)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Branch add/edit form */}
              {branchFormOpen ? (
                <form onSubmit={handleBranchSubmit} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <p className="text-sm font-semibold">{editingBranch ? 'Edit Branch' : 'New Branch'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Branch Name *</Label>
                      <Input className="h-9" value={branchFormData.name} onChange={e => {
                        const name = e.target.value;
                        setBranchFormData(f => ({ ...f, name, code: editingBranch ? f.code : name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) }));
                      }} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Code *</Label>
                      <Input className="h-9" value={branchFormData.code} onChange={e => setBranchFormData(f => ({ ...f, code: e.target.value.toUpperCase() }))} required maxLength={10} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone *</Label>
                      <Input className="h-9" value={branchFormData.phone} onChange={e => setBranchFormData(f => ({ ...f, phone: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email *</Label>
                      <Input className="h-9" type="email" value={branchFormData.email} onChange={e => setBranchFormData(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Principal Name</Label>
                      <Input className="h-9" value={branchFormData.principalName} onChange={e => setBranchFormData(f => ({ ...f, principalName: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Established Date *</Label>
                      <Input className="h-9" type="date" value={branchFormData.establishedDate} onChange={e => setBranchFormData(f => ({ ...f, establishedDate: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address *</Label>
                    <Textarea rows={2} value={branchFormData.address} onChange={e => setBranchFormData(f => ({ ...f, address: e.target.value }))} required />
                  </div>
                  <div className="space-y-1 max-w-[200px]">
                    <Label className="text-xs">Status</Label>
                    <Select value={branchFormData.status} onValueChange={(v: 'active' | 'inactive') => setBranchFormData(f => ({ ...f, status: v }))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setBranchFormOpen(false); resetBranchForm(); }}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={branchSaving}>
                      {branchSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {editingBranch ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button variant="outline" className="w-full mt-2" onClick={() => openBranchForm()}>
                  <Plus className="w-4 h-4 mr-2" /> Add Branch
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Branch Feature Settings Dialog */}
      <Dialog open={branchFeatureDialogOpen} onOpenChange={setBranchFeatureDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Feature Settings — {branchFeatureTarget?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Features disabled at the organization level cannot be enabled here.
            </p>
          </DialogHeader>
          {branchFeatureLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{branchEnabledFeatures.size}/{branchOrgFeatures.size} available</Badge>
                <Button size="sm" variant="outline" onClick={() => setBranchEnabledFeatures(new Set(branchOrgFeatures))}>Reset to Org Defaults</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {branchFeatureRegistry.map((feature) => {
                  const isOrgEnabled = branchOrgFeatures.has(feature.key);
                  const isBranchEnabled = branchEnabledFeatures.has(feature.key);
                  return (
                    <div key={feature.key} className={`flex items-start justify-between rounded-lg border p-3 transition-colors ${!isOrgEnabled ? 'border-border bg-muted/50 opacity-60' : isBranchEnabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}>
                      <div className="space-y-0.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{feature.label}</span>
                          {!isOrgEnabled ? (
                            <Badge variant="secondary" className="text-[10px] gap-1">Not in plan</Badge>
                          ) : (
                            <Badge variant={isBranchEnabled ? 'default' : 'secondary'} className="text-[10px]">{isBranchEnabled ? 'ON' : 'OFF'}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch checked={isBranchEnabled} onCheckedChange={() => toggleBranchFeature(feature.key)} disabled={!isOrgEnabled} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setBranchFeatureDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveBranchFeatures} disabled={branchFeatureSaving}>
                  {branchFeatureSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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

export default OrganizationManagement;
