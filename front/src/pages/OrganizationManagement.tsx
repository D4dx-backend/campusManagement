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
import { Plus, Search, Edit, Trash2, Building, Phone, Mail, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const OrganizationManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { user } = useAuth();

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
        description: error.response?.data?.message || 'Failed to save organization',
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
            description: error.response?.data?.message || 'Failed to delete organization',
            variant: 'destructive',
          });
        }
      }
    );
  };

  const filteredOrgs = organizations.filter((o: any) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                              <Button size="sm" variant="outline" onClick={() => handleEdit(org)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(org.id || org._id, org.name)}>
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
    </AppLayout>
  );
};

export default OrganizationManagement;
