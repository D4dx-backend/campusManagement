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
import { Branch } from '@/types';
import { Plus, Search, Edit, Trash2, Building, MapPin, Phone, Mail, User as UserIcon, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const BranchManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { user } = useAuth();

  // API hooks
  const { data: branchesResponse, isLoading } = useBranches();
  const { data: usersResponse } = useUsers({ limit: 1000 });
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
        description: error.response?.data?.message || 'Failed to save branch',
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
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, branchName: string) => {
    // Check if branch has users
    const branchUsers = users.filter((u: any) => u.branchId === id);
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
            description: error.response?.data?.message || 'Failed to delete branch',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const getBranchStats = (branchId: string) => {
    const branchUsers = users.filter((u: any) => u.branchId === branchId);
    return {
      totalUsers: branchUsers.length,
      admins: branchUsers.filter((u: any) => u.role === 'branch_admin').length,
      teachers: branchUsers.filter((u: any) => u.role === 'teacher').length,
      staff: branchUsers.filter((u: any) => u.role === 'staff').length,
    };
  };

  const filteredBranches = branches.filter((b: any) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.principalName && b.principalName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Only super admin can access this page
  if (user?.role !== 'super_admin') {
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingBranch ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
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
    </AppLayout>
  );
};

export default BranchManagement;