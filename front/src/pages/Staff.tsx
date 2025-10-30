import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, Edit, Trash2, UserCog, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '@/hooks/useStaff';
import { useDesignations } from '@/hooks/useDesignations';
import { useDepartments } from '@/hooks/useDepartments';
import { formatters } from '@/utils/exportUtils';
import { createApiFilters, filterMappings, createExportDataFetcher } from '@/utils/apiFilters';

const Staff = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { confirm, ConfirmationComponent } = useConfirmation();
  const { toast } = useToast();

  // API hooks with proper filter mapping
  const apiFilters = createApiFilters(
    currentPage,
    itemsPerPage,
    searchTerm,
    filterValues,
    filterMappings.staff
  );

  const { data: staffResponse, isLoading, error } = useStaff(apiFilters);

  const { data: designationsResponse, isLoading: designationsLoading } = useDesignations({ status: 'active', limit: 100 });
  const { data: departmentsResponse, isLoading: departmentsLoading } = useDepartments({ status: 'active', limit: 100 });

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();

  const designations = designationsResponse?.data || [];
  const departments = departmentsResponse?.data || [];

  // Filter configuration
  const filterOptions = [
    {
      key: 'designation',
      label: 'Designation',
      type: 'select' as const,
      options: designations.filter((designation: any) => designation.name).map((designation: any) => ({ 
        value: designation.name, 
        label: designation.name 
      }))
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select' as const,
      options: departments.filter((department: any) => department.name).map((department: any) => ({ 
        value: department.name, 
        label: department.name 
      }))
    },
    {
      key: 'dateOfJoining',
      label: 'Date of Joining',
      type: 'dateRange' as const
    },
    {
      key: 'salary',
      label: 'Salary Range',
      type: 'number' as const,
      placeholder: 'Minimum salary'
    }
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'Staff Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'dateOfJoining', label: 'Date of Joining', formatter: formatters.date },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'salary', label: 'Monthly Salary', formatter: formatters.currency },
    { key: 'address', label: 'Address' }
  ];

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    designation: '',
    department: '',
    dateOfJoining: '',
    phone: '',
    email: '',
    address: '',
    salary: '',
  });

  const resetForm = () => {
    setFormData({
      employeeId: '',
      name: '',
      designation: '',
      department: '',
      dateOfJoining: '',
      phone: '',
      email: '',
      address: '',
      salary: '',
    });
    setEditingStaff(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStaff) {
        await updateStaffMutation.mutateAsync({
          id: editingStaff._id,
          data: {
            ...formData,
            salary: parseFloat(formData.salary),
          }
        });
      } else {
        await createStaffMutation.mutateAsync({
          ...formData,
          salary: parseFloat(formData.salary),
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setFormData({
      employeeId: staffMember.employeeId,
      name: staffMember.name,
      designation: staffMember.designation,
      department: staffMember.department,
      dateOfJoining: staffMember.dateOfJoining.split('T')[0],
      phone: staffMember.phone,
      email: staffMember.email,
      address: staffMember.address,
      salary: staffMember.salary.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, staffName: string) => {
    confirm(
      {
        title: 'Delete Staff Member',
        description: `Are you sure you want to delete "${staffName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      () => {
        deleteStaffMutation.mutate(id);
      }
    );
  };

  // Get data from API (already filtered and paginated)
  const staff = staffResponse?.data || [];
  const pagination = staffResponse?.pagination;

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

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load staff members</p>
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
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground mt-1">Manage staff records and information</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                    />
                  </div>
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
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={(value) => setFormData({ ...formData, designation: value })}
                      disabled={designationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          designationsLoading 
                            ? "Loading designations..." 
                            : designations.length === 0 
                              ? "No designations available"
                              : "Select designation"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {designationsLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading designations...
                            </div>
                          </SelectItem>
                        ) : designations.length === 0 ? (
                          <SelectItem value="no-designations" disabled>
                            No designations available
                          </SelectItem>
                        ) : (
                          designations.map((designation: any) => (
                            <SelectItem key={designation._id} value={designation.name}>
                              {designation.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                      disabled={departmentsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          departmentsLoading 
                            ? "Loading departments..." 
                            : departments.length === 0 
                              ? "No departments available"
                              : "Select department"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading departments...
                            </div>
                          </SelectItem>
                        ) : departments.length === 0 ? (
                          <SelectItem value="no-departments" disabled>
                            No departments available
                          </SelectItem>
                        ) : (
                          departments.map((department: any) => (
                            <SelectItem key={department._id} value={department.name}>
                              {department.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary *</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={e => setFormData({ ...formData, salary: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <PhoneInput
                      id="phone"
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Optional email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter full address"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                  >
                    {(createStaffMutation.isPending || updateStaffMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingStaff ? 'Update' : 'Add'} Staff
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          searchPlaceholder="Search by name, employee ID, or designation..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'staff',
            columns: exportColumns,
            fetchAllData: createExportDataFetcher(
              useStaff,
              searchTerm,
              filterValues,
              filterMappings.staff,
              staff
            )
          }}
          pagination={{
            currentPage,
            totalPages: pagination?.pages || 1,
            totalItems: pagination?.total || 0,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          data={staff}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No staff members found"
          }}
        >
          <div className="grid gap-4">
            {staff.map((staffMember: any) => (
              <Card key={staffMember._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{staffMember.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {staffMember.employeeId}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Designation:</span>
                          <span className="ml-2 font-medium">{staffMember.designation}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Department:</span>
                          <span className="ml-2 font-medium">{staffMember.department}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="ml-2 font-medium">{staffMember.phone}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Salary:</span>
                          <span className="ml-2 font-medium">₹{staffMember.salary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(staffMember)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(staffMember._id, staffMember.name)}
                        disabled={deleteStaffMutation.isPending}
                      >
                        {deleteStaffMutation.isPending ? (
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
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default Staff;