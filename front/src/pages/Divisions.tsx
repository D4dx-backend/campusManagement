import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useClasses } from '@/hooks/useClasses';
import { useDivisions, useCreateDivision, useUpdateDivision, useDeleteDivision } from '@/hooks/useDivisions';
import { useStaff } from '@/hooks/useStaff';
import { Plus, Search, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const Divisions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // API hooks - only pass basic parameters
  const { data: divisionsResponse, isLoading: divisionsLoading, error: divisionsError } = useDivisions({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  });
  const { data: classesResponse, isLoading: classesLoading } = useClasses({
    limit: 100,
    status: 'active'
  });
  const { data: staffResponse } = useStaff({
    limit: 100,
    status: 'active'
  });

  const createDivisionMutation = useCreateDivision();
  const updateDivisionMutation = useUpdateDivision();
  const deleteDivisionMutation = useDeleteDivision();

  // Get raw data from API
  const rawDivisions = divisionsResponse?.data || [];
  
  // Apply frontend filters
  const divisions = rawDivisions.filter((division: any) => {
    // Apply class filter
    if (filterValues.class && division.classId !== filterValues.class) {
      return false;
    }
    
    // Apply class teacher filter
    if (filterValues.classTeacher && division.classTeacherId !== filterValues.classTeacher) {
      return false;
    }
    
    // Apply capacity filter (minimum capacity)
    if (filterValues.capacity && division.capacity < parseFloat(filterValues.capacity)) {
      return false;
    }
    
    return true;
  });
  const classes = classesResponse?.data || [];
  const staff = staffResponse?.data || [];
  const pagination = divisionsResponse?.pagination;

  // Get configuration from templates with dynamic options
  const config = {
    ...pageConfigurations.divisions,
    filters: pageConfigurations.divisions.filters.map(filter => {
      if (filter.key === 'class') {
        return { ...filter, options: classes.filter(cls => cls._id && cls.name).map(cls => ({ value: cls._id, label: `${cls.name} (${cls.academicYear})` })) };
      }
      if (filter.key === 'classTeacher') {
        return { ...filter, options: staff.filter(s => s._id && s.name).map(s => ({ value: s._id, label: s.name })) };
      }
      return filter;
    })
  };

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

  // Clear old localStorage data on component mount
  useEffect(() => {
    // Clear old localStorage divisions data
    localStorage.removeItem('campuswise_divisions');
    localStorage.removeItem('campuswise_staff');
  }, []);



  const [formData, setFormData] = useState({
    classId: '',
    name: '',
    capacity: '',
    classTeacherId: 'no-teacher',
    status: 'active' as 'active' | 'inactive',
  });

  const resetForm = () => {
    setFormData({
      classId: '',
      name: '',
      capacity: '',
      classTeacherId: 'no-teacher',
      status: 'active',
    });
    setEditingDivision(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClass = classes.find(c => c._id === formData.classId);
    const selectedTeacher = staff.find(s => s._id === formData.classTeacherId);
    
    const divisionData = {
      classId: formData.classId,
      className: selectedClass?.name || '',
      name: formData.name,
      capacity: parseInt(formData.capacity),
      classTeacherId: formData.classTeacherId === 'no-teacher' ? undefined : formData.classTeacherId || undefined,
      classTeacherName: formData.classTeacherId === 'no-teacher' ? undefined : selectedTeacher?.name || undefined,
      status: formData.status,
    };
    
    try {
      if (editingDivision) {
        await updateDivisionMutation.mutateAsync({
          id: editingDivision._id,
          ...divisionData
        });
      } else {
        await createDivisionMutation.mutateAsync(divisionData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleEdit = (division: any) => {
    setEditingDivision(division);
    setFormData({
      classId: division.classId,
      name: division.name,
      capacity: division.capacity.toString(),
      classTeacherId: division.classTeacherId || 'no-teacher',
      status: division.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, divisionName: string) => {
    confirm(
      {
        title: 'Delete Division',
        description: `Are you sure you want to delete "${divisionName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      () => {
        deleteDivisionMutation.mutate(id);
      }
    );
  };



  const activeClasses = classes.filter(c => c.status === 'active');
  const activeStaff = staff.filter(s => s.status === 'active');

  // Show loading state while data is being fetched
  if (divisionsLoading || classesLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading divisions...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show error state
  if (divisionsError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load divisions</p>
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
            <h1 className="text-3xl font-bold">Divisions Management</h1>
            <p className="text-muted-foreground mt-1">Manage class divisions and sections</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Division
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingDivision ? 'Edit Division' : 'Add New Division'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeClasses.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          {classesLoading ? 'Loading classes...' : 'No active classes available'}
                        </SelectItem>
                      ) : (
                        activeClasses.map(classItem => (
                          <SelectItem key={classItem._id} value={classItem._id}>
                            {classItem.name} ({classItem.academicYear})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Division Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., A, B, C, Alpha, Beta"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="Maximum number of students"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classTeacherId">Class Teacher</Label>
                  <Select
                    value={formData.classTeacherId}
                    onValueChange={(value) => setFormData({ ...formData, classTeacherId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class teacher (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-teacher">No teacher assigned</SelectItem>
                      {activeStaff.length === 0 ? (
                        <SelectItem value="no-staff" disabled>
                          No active staff available
                        </SelectItem>
                      ) : (
                        activeStaff.map(teacher => (
                          <SelectItem key={teacher._id} value={teacher._id}>
                            {teacher.name} - {teacher.designation}
                          </SelectItem>
                        ))
                      )}
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createDivisionMutation.isPending || updateDivisionMutation.isPending}
                  >
                    {(createDivisionMutation.isPending || updateDivisionMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingDivision ? 'Update' : 'Add'} Division
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          searchPlaceholder="Search by division name, class, or teacher..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'divisions',
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
          data={divisions}
          isLoading={divisionsLoading}
          error={divisionsError}
          emptyState={{
            icon: <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No divisions found"
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {divisions.map(division => (
              <Card key={division._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {division.className} - {division.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {division.capacity} students
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(division)}
                        disabled={updateDivisionMutation.isPending}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(division._id, `${division.className} - ${division.name}`)}
                        disabled={deleteDivisionMutation.isPending}
                      >
                        {deleteDivisionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {division.classTeacherName && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Class Teacher: {division.classTeacherName}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      division.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {division.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(division.createdAt).toLocaleDateString()}
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

export default Divisions;