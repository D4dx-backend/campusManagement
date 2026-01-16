import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useBranches } from '@/hooks/useBranches';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { authService } from '@/services/authService';
import { User, UserRole, Permission } from '@/types';
import { Plus, Search, Edit, Trash2, Users, Shield, Smartphone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const UserAccess = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<any>({});
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { user: currentUser } = useAuth();

  // API hooks
  const { data: usersResponse, isLoading } = useUsers({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    role: filterValues.role,
    status: filterValues.status,
  });
  
  // Get branches from API only for super admins
  const { data: branchesResponse, isLoading: branchesLoading, error: branchesError } = useBranches(
    currentUser?.role === 'super_admin'
  );
  
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;
  const branches = branchesResponse?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    pin: '',
    role: 'staff' as UserRole,
    branchId: '', // Will be handled by backend for non-super admins
    status: 'active' as 'active' | 'inactive',
    permissions: [] as Permission[],
  });

  const availableModules = [
    'Students', 'Staff', 'Fees', 'Payroll', 'Expenses', 'TextBooks', 'Reports', 
    'Classes', 'Divisions', 'Departments', 'ActivityLog'
  ];

  const availableActions = ['create', 'read', 'update', 'delete'] as const;

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      pin: '',
      role: 'staff',
      branchId: currentUser?.role === 'super_admin' ? '' : '', // Backend will handle branch assignment
      status: 'active',
      permissions: [],
    });
    setEditingUser(null);
  };

  // Get configuration from templates
  const config = pageConfigurations.userAccess;

  // Filter handlers
  const handleFilterChange = (values: any) => {
    setFilterValues(values);
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData({ ...formData, pin });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate that super admin selects a branch when creating non-super admin users
      if (currentUser?.role === 'super_admin' && formData.role !== 'super_admin' && !formData.branchId) {
        toast({ 
          title: 'Validation Error', 
          description: 'Please select a branch for this user.',
          variant: 'destructive'
        });
        return;
      }

      // Prepare user data - for non-super admins, don't include branchId (backend will handle it)
      const userData = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        pin: formData.pin,
        role: formData.role,
        ...(currentUser?.role === 'super_admin' && formData.role !== 'super_admin' && formData.branchId && { branchId: formData.branchId }),
        permissions: formData.permissions,
        status: formData.status
      };

      if (editingUser) {
        // Update existing user
        await updateUserMutation.mutateAsync({
          id: editingUser._id || editingUser.id,
          ...userData
        });
        toast({ title: 'User updated successfully' });
      } else {
        // Create new user via API
        await createUserMutation.mutateAsync(userData);
        toast({ title: 'User created successfully' });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || (editingUser ? 'Failed to update user' : 'Failed to create user'),
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      pin: user.pin,
      role: user.role,
      branchId: user.branchId || '',
      status: user.status,
      permissions: user.permissions || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, userName: string) => {
    confirm(
      {
        title: 'Delete User',
        description: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      async () => {
        try {
          await deleteUserMutation.mutateAsync(id);
          toast({ title: 'User deleted successfully' });
        } catch (error: any) {
          toast({ 
            title: 'Error', 
            description: error.response?.data?.message || 'Failed to delete user',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const updatedPermissions = [...formData.permissions];
    const moduleIndex = updatedPermissions.findIndex(p => p.module === module);
    
    if (moduleIndex >= 0) {
      if (checked) {
        if (!updatedPermissions[moduleIndex].actions.includes(action as any)) {
          updatedPermissions[moduleIndex].actions.push(action as any);
        }
      } else {
        updatedPermissions[moduleIndex].actions = updatedPermissions[moduleIndex].actions.filter(a => a !== action);
        if (updatedPermissions[moduleIndex].actions.length === 0) {
          updatedPermissions.splice(moduleIndex, 1);
        }
      }
    } else if (checked) {
      updatedPermissions.push({ module, actions: [action as any] });
    }
    
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const hasPermission = (module: string, action: string) => {
    const modulePermission = formData.permissions.find(p => p.module === module);
    return modulePermission?.actions.includes(action as any) || false;
  };



  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'branch_admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'accountant': return 'bg-green-100 text-green-800';
      case 'staff': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state while branches are being fetched (only for super admins)
  if (branchesLoading && currentUser?.role === 'super_admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading branches...</span>
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
            <h1 className="text-3xl font-bold">User Access Management</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information and permissions.' : 'Create a new user account with role-based permissions.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        required
                        className="pl-10"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">4-Digit PIN *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="pin"
                          type={showPin ? "text" : "password"}
                          placeholder="4-digit PIN"
                          value={formData.pin}
                          onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          required
                          maxLength={4}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button type="button" variant="outline" onClick={generatePin}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentUser?.role === 'super_admin' && (
                          <>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="branch_admin">Branch Admin</SelectItem>
                          </>
                        )}
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.role !== 'super_admin' && currentUser?.role === 'super_admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="branchId">Branch *</Label>
                      <Select
                        value={formData.branchId}
                        onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branchesError ? (
                            <SelectItem value="error" disabled>
                              Error loading branches
                            </SelectItem>
                          ) : branches.filter(b => b.status === 'active').length === 0 ? (
                            <SelectItem value="no-branches" disabled>
                              {branchesLoading ? 'Loading branches...' : 'No active branches available'}
                            </SelectItem>
                          ) : (
                            branches.filter(b => b.status === 'active').map(branch => (
                              <SelectItem key={branch.id || branch._id} value={branch.id || branch._id}>
                                {branch.name} ({branch.code})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {formData.role !== 'super_admin' && currentUser?.role !== 'super_admin' && (
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                        Users will be assigned to your branch automatically
                      </div>
                    </div>
                  )}
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

                {/* Permissions Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <Label className="text-base font-semibold">Module Permissions</Label>
                  </div>
                  <div className="grid gap-4">
                    {availableModules.map(module => (
                      <Card key={module} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{module}</h4>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {availableActions.map(action => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${module}-${action}`}
                                checked={hasPermission(module, action)}
                                onCheckedChange={(checked) => handlePermissionChange(module, action, checked as boolean)}
                              />
                              <Label htmlFor={`${module}-${action}`} className="text-sm capitalize">
                                {action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Update' : 'Add'} User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          searchPlaceholder="Search by name, email, mobile, or role..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'user_access',
            columns: config.exportColumns.map(col => ({
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
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          data={users}
          isLoading={isLoading}
          error={null}
          emptyState={{
            icon: <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No users found"
          }}
        >
          <div className="grid gap-4">
            {users.map(user => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-2 font-medium">{user.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mobile:</span>
                          <span className="ml-2 font-medium">{user.mobile}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PIN:</span>
                          <span className="ml-2 font-medium">••••</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Login:</span>
                          <span className="ml-2 font-medium">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Permissions:</span>
                        <span className="ml-2">
                          {user.permissions?.length > 0 
                            ? `${user.permissions.length} modules` 
                            : 'No permissions assigned'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(user.id, user.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>
      </div>
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default UserAccess;