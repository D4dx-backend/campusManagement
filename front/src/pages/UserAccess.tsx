import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useBranches } from '@/hooks/useBranches';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetPin, useApproveUser, useRejectUser } from '@/hooks/useUsers';
import { User, UserRole, Permission } from '@/types';
import { Plus, Edit, Trash2, Users, Shield, Smartphone, Eye, EyeOff, Loader2, KeyRound, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { formatters } from '@/utils/exportUtils';
import { normalizeModule } from '@/utils/accessControl';

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
    branchId: filterValues.branch,
    role: filterValues.role,
    status: filterValues.status,
    approvalStatus: filterValues.approvalStatus,
  });
  
  // Get branches from API only for super admins
  const { data: branchesResponse, isLoading: branchesLoading, error: branchesError } = useBranches(
    (currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin')
  );
  
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const resetPinMutation = useResetPin();
  const approveUserMutation = useApproveUser();
  const rejectUserMutation = useRejectUser();

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
    { label: 'Students', value: 'students' },
    { label: 'Staff', value: 'staff' },
    { label: 'Fees', value: 'fees' },
    { label: 'Payroll', value: 'payroll' },
    { label: 'Expenses', value: 'expenses' },
    { label: 'Text Books', value: 'textbooks' },
    { label: 'Reports', value: 'reports' },
    { label: 'Classes', value: 'classes' },
    { label: 'Divisions', value: 'divisions' },
    { label: 'Departments', value: 'departments' },
    { label: 'Activity Logs', value: 'activity_logs' },
    { label: 'Accounting', value: 'accounting' },
  ];

  const availableActions = ['create', 'read', 'update', 'delete'] as const;

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      pin: '',
      role: 'staff',
      branchId: (currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') ? '' : '', // Backend will handle branch assignment
      status: 'active',
      permissions: [],
    });
    setEditingUser(null);
  };

  const branchOptions = (branches.length > 0
    ? branches
        .filter((branch: any) => (branch.id || branch._id) && branch.name)
        .map((branch: any) => ({
          value: branch.id || branch._id,
          label: branch.name
        }))
    : currentUser?.branchId
      ? [{ value: currentUser.branchId, label: 'My Branch' }]
      : []
  );
  const userFilters = [
    {
      key: 'branch',
      label: 'Branch',
      type: 'select' as const,
      options: branchOptions
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'platform_admin', label: 'Platform Admin' },
        { value: 'org_admin', label: 'Organization Admin' },
        { value: 'branch_admin', label: 'Branch Admin' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'accountant', label: 'Accountant' },
        { value: 'staff', label: 'Staff' }
      ]
    },
    {
      key: 'status',
      label: 'Login Status',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'approvalStatus',
      label: 'Approval',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ];

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
      if ((currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (formData.role !== 'platform_admin' && formData.role !== 'org_admin') && !formData.branchId) {
        toast({ 
          title: 'Validation Error', 
          description: 'Please select a branch for this user.',
          variant: 'destructive'
        });
        return;
      }

      // Prepare user data - for non-super admins, don't include branchId (backend will handle it)
      const userData: any = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        ...((currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (formData.role !== 'platform_admin' && formData.role !== 'org_admin') && formData.branchId && { branchId: formData.branchId }),
        permissions: formData.permissions.map((permission) => ({
          ...permission,
          module: normalizeModule(permission.module),
        })),
        status: formData.status
      };

      if (!editingUser || formData.pin) {
        userData.pin = formData.pin;
      }

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
        description: error.response?.data?.message || (editingUser ? 'Something went wrong while updating. Please try again user' : 'Something went wrong while creating. Please try again user'),
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    const branchIdValue =
      (user as any).branchId?._id ||
      (user as any).branchId?.id ||
      (user as any).branchId ||
      '';
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      pin: '',
      role: user.role,
      branchId: branchIdValue,
      status: user.status,
      permissions: (user.permissions || []).map((permission) => ({
        ...permission,
        module: normalizeModule(permission.module),
      })),
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
            description: error.response?.data?.message || 'Something went wrong while deleting. Please try again user',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const updatedPermissions = [...formData.permissions];
    const normalizedModule = normalizeModule(module);
    const moduleIndex = updatedPermissions.findIndex(p => normalizeModule(p.module) === normalizedModule);
    
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
      updatedPermissions.push({ module: normalizedModule, actions: [action as any] });
    }
    
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const hasPermission = (module: string, action: string) => {
    const normalizedModule = normalizeModule(module);
    const modulePermission = formData.permissions.find(p => normalizeModule(p.module) === normalizedModule);
    return modulePermission?.actions.includes(action as any) || false;
  };



  const handleResetPin = async (id: string, userName: string) => {
    confirm(
      {
        title: 'Reset PIN',
        description: `Reset the PIN for "${userName}"? A new random 4-digit PIN will be generated.`,
        confirmText: 'Reset PIN',
        variant: 'destructive'
      },
      async () => {
        try {
          const result = await resetPinMutation.mutateAsync(id);
          const newPin = result?.data?.pin;
          toast({
            title: 'PIN Reset Successfully',
            description: newPin
              ? `New PIN for ${userName}: ${newPin}`
              : 'PIN has been reset.',
            duration: 15000, // Keep visible longer so they can note it down
          });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Something went wrong while resetting the PIN. Please try again.',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'platform_admin': case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'branch_admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'accountant': return 'bg-green-100 text-green-800';
      case 'staff': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'platform_admin': return 'Platform Admin';
      case 'org_admin': return 'Organization Admin';
      case 'branch_admin': return 'Branch Admin';
      case 'accountant': return 'Accountant';
      case 'teacher': return 'Teacher';
      case 'staff': return 'Staff';
      default: return role;
    }
  };

  const getLoginStatusLabel = (status: User['status']) => {
    return status === 'active' ? 'Login Active' : 'Login Inactive';
  };

  const getDisplayEmail = (email?: string) => {
    if (!email || email.endsWith('@placeholder.local')) {
      return 'Not provided';
    }

    return email;
  };

  const getApprovalBadge = (approvalStatus?: string) => {
    switch (approvalStatus) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      default: return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    }
  };

  const handleApprove = async (id: string, userName: string) => {
    confirm(
      {
        title: 'Approve User Access',
        description: `Approve access for "${userName}"? A login PIN will be generated.`,
        confirmText: 'Approve',
      },
      async () => {
        try {
          const result = await approveUserMutation.mutateAsync(id);
          const pin = result?.data?.pin;
          toast({
            title: 'User Approved',
            description: pin
              ? `Login PIN for ${userName}: ${pin}. Please share this with the staff member.`
              : 'User has been approved.',
            duration: 20000,
          });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Something went wrong while approving the user.',
            variant: 'destructive'
          });
        }
      }
    );
  };

  const handleReject = async (id: string, userName: string) => {
    confirm(
      {
        title: 'Reject User Access',
        description: `Are you sure you want to reject access for "${userName}"?`,
        confirmText: 'Reject',
        variant: 'destructive'
      },
      async () => {
        try {
          await rejectUserMutation.mutateAsync(id);
          toast({ title: 'User access rejected' });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Something went wrong while rejecting the user.',
            variant: 'destructive'
          });
        }
      }
    );
  };

  // Show loading state while branches are being fetched (only for super admins)
  if (branchesLoading && (currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin')) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          placeholder={editingUser ? "Leave blank to keep current PIN" : "4-digit PIN"}
                          value={formData.pin}
                          onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          required={!editingUser}
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
                        {currentUser?.role === 'platform_admin' && (
                          <SelectItem value="platform_admin">Platform Admin</SelectItem>
                        )}
                        {(currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (
                          <>
                            <SelectItem value="org_admin">Organization Admin</SelectItem>
                            <SelectItem value="branch_admin">Branch Admin</SelectItem>
                          </>
                        )}
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.role !== 'platform_admin' && formData.role !== 'org_admin') && (currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (
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
                  {(formData.role !== 'platform_admin' && formData.role !== 'org_admin') && (currentUser?.role !== 'platform_admin' && currentUser?.role !== 'org_admin') && (
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
                    {availableModules.map((module) => (
                      <Card key={module.value} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{module.label}</h4>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {availableActions.map(action => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${module.value}-${action}`}
                                checked={hasPermission(module.value, action)}
                                onCheckedChange={(checked) => handlePermissionChange(module.value, action, checked as boolean)}
                              />
                              <Label htmlFor={`${module.value}-${action}`} className="text-sm capitalize">
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
          filters={userFilters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'user_access',
            columns: [
              { key: 'name', label: 'Full Name' },
              { key: 'email', label: 'Email' },
              { key: 'mobile', label: 'Mobile' },
              { key: 'role', label: 'Role', formatter: formatters.capitalize },
              { key: 'status', label: 'Login Status', formatter: formatters.capitalize },
              { key: 'approvalStatus', label: 'Approval Status', formatter: formatters.capitalize },
              { key: 'lastLogin', label: 'Last Login', formatter: formatters.date },
              { key: 'createdAt', label: 'Created Date', formatter: formatters.date }
            ].map(col => ({
              ...col,
              formatter: typeof col.formatter === 'string' ? formatters[col.formatter] : col.formatter
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
            message: 'No users found'
          }}
        >
          <div className="grid gap-4">
            {users.map(user => (
              <Card key={user._id || user.id}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold">{user.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {getRoleLabel(user.role)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {getLoginStatusLabel(user.status)}
                          </Badge>
                          {getApprovalBadge((user as any).approvalStatus)}
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
                          <div className="mt-1 break-all font-medium">{getDisplayEmail(user.email)}</div>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mobile</div>
                          <div className="mt-1 font-medium">{user.mobile || 'Not provided'}</div>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">PIN</div>
                          <div className="mt-1 font-medium">••••</div>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Login</div>
                          <div className="mt-1 font-medium">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">Organization:</span>
                          <span className="ml-2 font-medium">
                            {(user as any).organizationId?.name || 'Not assigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="ml-2 font-medium">
                            {(user as any).branchId?.name || 'Organization Level'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Permissions:</span>
                          <span className="ml-2 font-medium">
                            {user.permissions?.length > 0
                              ? `${user.permissions.length} modules`
                              : 'No permissions assigned'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:w-auto lg:flex-col lg:items-stretch">
                      {(user as any).approvalStatus === 'pending' && (currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (
                        <>
                          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(user._id || user.id, user.name)}>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-2" onClick={() => handleReject(user._id || user.id, user.name)}>
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      {(user as any).approvalStatus === 'rejected' && (currentUser?.role === 'platform_admin' || currentUser?.role === 'org_admin') && (
                        <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(user._id || user.id, user.name)}>
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      {(user as any).approvalStatus !== 'pending' && (
                        <Button size="sm" variant="outline" className="gap-2" title="Reset PIN" onClick={() => handleResetPin(user._id || user.id, user.name)}>
                          <KeyRound className="h-4 w-4" />
                          Reset PIN
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => handleDelete(user._id || user.id, user.name)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
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