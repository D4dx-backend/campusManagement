import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useDepartments';
import { Department } from '@/services/departments';
import { Plus, Search, Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const Departments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // API hooks - only pass basic parameters
  const { data: departmentsResponse, isLoading, error } = useDepartments({ 
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  });
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();

  // Get raw data from API
  const rawDepartments = departmentsResponse?.data || [];
  
  // Apply frontend filters
  const departments = rawDepartments.filter((department: any) => {
    // Apply status filter
    if (filterValues.status && department.status !== filterValues.status) {
      return false;
    }
    
    // Apply date range filter for createdAt
    if (filterValues.createdAt_from) {
      const createdDate = new Date(department.createdAt);
      const fromDate = new Date(filterValues.createdAt_from);
      if (createdDate < fromDate) return false;
    }
    
    if (filterValues.createdAt_to) {
      const createdDate = new Date(department.createdAt);
      const toDate = new Date(filterValues.createdAt_to);
      if (createdDate > toDate) return false;
    }
    
    return true;
  });
  const pagination = departmentsResponse?.pagination;

  // Get configuration from templates
  const config = pageConfigurations.departments;

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

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    headOfDepartment: '',
    status: 'active' as 'active' | 'inactive',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      headOfDepartment: '',
      status: 'active',
    });
    setEditingDepartment(null);
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
      code: editingDepartment ? formData.code : generateCode(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDepartment) {
        await updateDepartmentMutation.mutateAsync({
          id: editingDepartment._id,
          ...formData
        });
      } else {
        await createDepartmentMutation.mutateAsync(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Error submitting department:', error);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      headOfDepartment: department.headOfDepartment || '',
      status: department.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, departmentName: string) => {
    confirm(
      {
        title: 'Delete Department',
        description: `Are you sure you want to delete "${departmentName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      async () => {
        try {
          await deleteDepartmentMutation.mutateAsync(id);
        } catch (error) {
          // Error handling is done in the mutation hook
          console.error('Error deleting department:', error);
        }
      }
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading departments...</span>
        </div>
      </AppLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading departments</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
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
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground mt-1">Manage school departments and organizational structure</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Mathematics, Science, Administration"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Department Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., MATH, SCI, ADMIN"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique code for this department (auto-generated from name)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the department"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headOfDepartment">Head of Department</Label>
                  <Input
                    id="headOfDepartment"
                    placeholder="Name of department head"
                    value={formData.headOfDepartment}
                    onChange={e => setFormData({ ...formData, headOfDepartment: e.target.value })}
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
                  <Button 
                    type="submit" 
                    disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                  >
                    {(createDepartmentMutation.isPending || updateDepartmentMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingDepartment ? 'Update' : 'Add'} Department
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          searchPlaceholder="Search by name or code..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'departments',
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
          data={departments}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No departments found"
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map(department => (
              <Card key={department._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{department.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{department.code}</p>
                      {department.description && (
                        <p className="text-sm text-muted-foreground mt-1">{department.description}</p>
                      )}
                      {department.headOfDepartment && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Head: {department.headOfDepartment}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(department)}
                        disabled={updateDepartmentMutation.isPending}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(department._id, department.name)}
                        disabled={deleteDepartmentMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      department.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {department.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(department.createdAt).toLocaleDateString()}
                    </span>
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

export default Departments;