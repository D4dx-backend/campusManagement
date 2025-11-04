import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, Edit, Trash2, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass } from '@/hooks/useClasses';
import { useBranches } from '@/hooks/useBranches';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const Classes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Get branches for super admins
  const { data: branchesResponse, isLoading: branchesLoading } = useBranches(user?.role === 'super_admin');
  const branches = branchesResponse?.data || [];
  
  // Debug log
  useEffect(() => {
    if (user?.role === 'super_admin') {
      console.log('Branches loaded:', branches.length, branches);
    }
  }, [branches, user?.role]);

  // Check if user has classes read permission
  const hasClassesReadPermission = user?.permissions?.some(
    p => p.module === 'classes' && p.actions.includes('read')
  );

  // Check if user has classes create permission
  const hasClassesCreatePermission = user?.permissions?.some(
    p => p.module === 'classes' && p.actions.includes('create')
  );

  // API hooks
  const { data: classesResponse, isLoading, error } = useClasses({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    ...filterValues,
  });



  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();

  const [formData, setFormData] = useState({
    name: '',
    academicYear: new Date().getFullYear().toString(),
    status: 'active' as 'active' | 'inactive',
    branchId: '' as string,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      academicYear: new Date().getFullYear().toString(),
      status: 'active',
      branchId: '',
    });
    setEditingClass(null);
  };

  // Get configuration from templates
  const config = pageConfigurations.classes;
  const classes = classesResponse?.data || [];
  const pagination = classesResponse?.pagination;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate branchId for super admin when creating
    if (user?.role === 'super_admin' && !editingClass && !formData.branchId) {
      toast({
        title: 'Error',
        description: 'Please select a branch',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (editingClass) {
        await updateClassMutation.mutateAsync({
          id: editingClass._id,
          ...formData,
        });
      } else {
        // Only send branchId if it's provided (for super admins)
        const createData = { ...formData };
        if (!createData.branchId || createData.branchId === '') {
          delete createData.branchId;
        }
        console.log('Creating class with data:', createData);
        await createClassMutation.mutateAsync(createData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      academicYear: classItem.academicYear,
      status: classItem.status,
      branchId: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, className: string) => {
    confirm(
      {
        title: 'Delete Class',
        description: `Are you sure you want to delete "${className}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      async () => {
        try {
          await deleteClassMutation.mutateAsync(id);
        } catch (error) {
          // Error handling is done in the mutation hook
        }
      }
    );
  };



  // Show permission error if user doesn't have access
  if (!hasClassesReadPermission) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to view classes.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to request access.
            </p>
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
            <h1 className="text-3xl font-bold">Classes Management</h1>
            <p className="text-muted-foreground mt-1">Manage class structures and academic years</p>
          </div>
          {hasClassesCreatePermission && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Class
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update class information' : 'Create a new class for your branch'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Class 10, Grade 5, Nursery"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    placeholder="e.g., 2024-25"
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                  />
                </div>
                {user?.role === 'super_admin' && !editingClass && (
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
                        {branches.filter(b => b.status === 'active').length === 0 ? (
                          <SelectItem value="no-branches" disabled>
                            No active branches available
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
                  <Button type="submit" disabled={createClassMutation.isPending || updateClassMutation.isPending}>
                    {(createClassMutation.isPending || updateClassMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingClass ? 'Update' : 'Add'} Class
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by class name or academic year..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Error loading classes</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error?.message || 'Unknown error occurred'}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No classes found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {classes.map(classItem => (
                        <Card key={classItem._id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{classItem.name}</h3>
                                <p className="text-sm text-muted-foreground">{classItem.academicYear}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(classItem)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleDelete(classItem._id, classItem.name)}
                                  disabled={deleteClassMutation.isPending}
                                >
                                  {deleteClassMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                classItem.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {classItem.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(classItem.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4">
                          Page {currentPage} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                          disabled={currentPage === pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default Classes;