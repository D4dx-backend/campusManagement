import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, Edit, Trash2, UserCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useDivisionsByClass } from '@/hooks/useDivisions';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';
import { formatters } from '@/utils/exportUtils';
import { createApiFilters, filterMappings, createExportDataFetcher } from '@/utils/apiFilters';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // API hooks with proper filter mapping
  const apiFilters = createApiFilters(
    currentPage,
    itemsPerPage,
    searchTerm,
    filterValues,
    filterMappings.students
  );

  const { data: studentsResponse, isLoading, error } = useStudents(apiFilters);

  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  const [formData, setFormData] = useState({
    admissionNo: '',
    name: '',
    class: '',
    section: '',
    dateOfBirth: '',
    dateOfAdmission: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    gender: '' as 'male' | 'female' | '',
    address: '',
    transport: 'none' as 'school' | 'own' | 'none',
    transportRoute: '',
    isStaffChild: false,
  });

  // API hooks for classes and divisions
  const { data: classesResponse } = useClasses({ status: 'active', limit: 100 });
  const { data: divisionsResponse, isLoading: divisionsLoading, error: divisionsError } = useDivisionsByClass(formData.class);
  const { data: transportRoutesResponse } = useTransportRoutes({ status: 'active', limit: 100 });

  const classes = classesResponse?.data || [];
  const divisions = divisionsResponse?.data || [];
  const transportRoutes = transportRoutesResponse?.data || [];

  // Filter configuration
  const filterOptions = [
    {
      key: 'class',
      label: 'Class',
      type: 'select' as const,
      options: classes.filter((cls: any) => cls._id && cls.name).map((cls: any) => ({ 
        value: cls._id, 
        label: `${cls.name} (${cls.academicYear})` 
      }))
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select' as const,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' }
      ]
    },
    {
      key: 'transport',
      label: 'Transport',
      type: 'select' as const,
      options: [
        { value: 'school', label: 'School Transport' },
        { value: 'own', label: 'Own Transport' },
        { value: 'none', label: 'No Transport' }
      ]
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'dateRange' as const
    }
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'admissionNo', label: 'Admission No' },
    { key: 'name', label: 'Student Name' },
    { key: 'class', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'dateOfBirth', label: 'Date of Birth', formatter: formatters.date },
    { key: 'dateOfAdmission', label: 'Date of Admission', formatter: formatters.date },
    { key: 'gender', label: 'Gender', formatter: formatters.capitalize },
    { key: 'guardianName', label: 'Guardian Name' },
    { key: 'guardianPhone', label: 'Guardian Phone' },
    { key: 'guardianEmail', label: 'Guardian Email' },
    { key: 'address', label: 'Address' },
    { key: 'transport', label: 'Transport', formatter: formatters.capitalize },
    { key: 'transportRoute', label: 'Transport Route' }
  ];

  // Show error if divisions fail to load
  useEffect(() => {
    if (divisionsError) {
      console.error('Divisions error:', divisionsError);
      toast({
        title: 'Error',
        description: 'Failed to load divisions for the selected class',
        variant: 'destructive',
      });
    }
  }, [divisionsError, toast]);

  // Debug: Log when class changes
  useEffect(() => {
    if (formData.class) {
      console.log('Class selected:', formData.class);
      console.log('Will fetch divisions for class ID:', formData.class);
      console.log('Divisions response:', divisionsResponse);
      console.log('Divisions loading:', divisionsLoading);
      console.log('Divisions data:', divisions);
    }
  }, [formData.class, divisionsResponse, divisionsLoading, divisions]);

  const resetForm = () => {
    setFormData({
      admissionNo: '',
      name: '',
      class: '',
      section: '',
      dateOfBirth: '',
      dateOfAdmission: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      gender: '',
      address: '',
      transport: 'none',
      transportRoute: '',
      isStaffChild: false,
    });
    setEditingStudent(null);
  };

  // Reset section when class changes
  useEffect(() => {
    if (formData.class && formData.section) {
      // Check if current section is still valid for the selected class
      const validSections = divisions.map(d => d.name);
      if (!validSections.includes(formData.section)) {
        setFormData(prev => ({ ...prev, section: '' }));
      }
    }
  }, [formData.class, divisions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStudent) {
        await updateStudentMutation.mutateAsync({
          id: editingStudent._id,
          data: formData
        });
      } else {
        await createStudentMutation.mutateAsync(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };
  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      admissionNo: student.admissionNo,
      name: student.name,
      class: student.classId || student.class, // Use classId if available, fallback to class name
      section: student.section,
      dateOfBirth: student.dateOfBirth.split('T')[0], // Format date for input
      dateOfAdmission: student.dateOfAdmission ? student.dateOfAdmission.split('T')[0] : '',
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianEmail: student.guardianEmail || '',
      gender: student.gender || '',
      address: student.address,
      transport: student.transport,
      transportRoute: student.transportRoute || '',
      isStaffChild: student.isStaffChild || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, studentName: string) => {
    confirm(
      {
        title: 'Delete Student',
        description: `Are you sure you want to delete "${studentName}"? This action cannot be undone and will remove all associated records.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      () => {
        deleteStudentMutation.mutate(id);
      }
    );
  };

  // Get data from API (already filtered and paginated)
  const students = studentsResponse?.data || [];
  const pagination = studentsResponse?.pagination;

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
            <p className="text-destructive mb-4">Failed to load students</p>
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
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="text-muted-foreground mt-1">Manage student records and information</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? 'Update student information' : 'Enter student details to add them to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admissionNo">Admission No *</Label>
                    <Input
                      id="admissionNo"
                      value={formData.admissionNo}
                      onChange={e => setFormData({ ...formData, admissionNo: e.target.value })}
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
                    <Label htmlFor="class">Class *</Label>
                    <Select
                      value={formData.class}
                      onValueChange={(value) => setFormData({ ...formData, class: value, section: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.name} ({cls.academicYear})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Division/Section *</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) => setFormData({ ...formData, section: value })}
                      disabled={!formData.class || divisionsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.class 
                            ? "Select class first" 
                            : divisionsLoading 
                              ? "Loading divisions..." 
                              : divisions.length === 0 
                                ? "No divisions available"
                                : "Select division/section"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {divisionsLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading divisions...
                            </div>
                          </SelectItem>
                        ) : divisions.length === 0 ? (
                          <SelectItem value="no-divisions" disabled>
                            No divisions available for this class
                          </SelectItem>
                        ) : (
                          divisions.map((division: any) => (
                            <SelectItem key={division._id} value={division.name}>
                              <div className="flex flex-col">
                                <span className="font-medium">Division {division.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Capacity: {division.capacity} | Available: {division.availableCapacity || division.capacity}
                                  {division.classTeacherName && ` | Teacher: ${division.classTeacherName}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfAdmission">Date of Admission *</Label>
                    <Input
                      id="dateOfAdmission"
                      type="date"
                      value={formData.dateOfAdmission}
                      onChange={e => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name *</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Guardian Phone *</Label>
                    <PhoneInput
                      id="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={(value) => setFormData({ ...formData, guardianPhone: value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail}
                      onChange={e => setFormData({ ...formData, guardianEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport">Transport</Label>
                    <Select
                      value={formData.transport}
                      onValueChange={(value: 'school' | 'own' | 'none') => setFormData({ ...formData, transport: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Transport</SelectItem>
                        <SelectItem value="school">School Transport</SelectItem>
                        <SelectItem value="own">Own Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.transport === 'school' && (
                    <div className="space-y-2">
                      <Label htmlFor="transportRoute">Transport Route</Label>
                      <Select
                        value={formData.transportRoute}
                        onValueChange={(value) => setFormData({ ...formData, transportRoute: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport route" />
                        </SelectTrigger>
                        <SelectContent>
                          {transportRoutes.map((route: any) => (
                            <SelectItem key={route._id} value={route.routeCode}>
                              {route.routeName} ({route.routeCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                    placeholder="Enter full address"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isStaffChild"
                    checked={formData.isStaffChild}
                    onChange={e => setFormData({ ...formData, isStaffChild: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isStaffChild" className="cursor-pointer">
                    Staff Child (Eligible for fee discount)
                  </Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                  >
                    {(createStudentMutation.isPending || updateStudentMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingStudent ? 'Update' : 'Add'} Student
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          searchPlaceholder="Search by name, admission no, or guardian name..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'students',
            columns: exportColumns,
            fetchAllData: createExportDataFetcher(
              useStudents,
              searchTerm,
              filterValues,
              filterMappings.students,
              students
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
          data={students}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No students found"
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Admission No</th>
                  <th className="text-left p-3 font-semibold">Student Name</th>
                  <th className="text-left p-3 font-semibold">Class</th>
                  <th className="text-left p-3 font-semibold">Guardian</th>
                  <th className="text-left p-3 font-semibold">Phone</th>
                  <th className="text-left p-3 font-semibold">Gender</th>
                  <th className="text-left p-3 font-semibold">Transport</th>
                  <th className="text-left p-3 font-semibold">Staff Child</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student._id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{student.admissionNo}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold">{student.name}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{student.class}-{student.section}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{student.guardianName}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{student.guardianPhone}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm capitalize">{student.gender}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm capitalize">{student.transport}</span>
                    </td>
                    <td className="p-3">
                      {student.isStaffChild ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Yes</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(student._id, student.name)}
                          disabled={deleteStudentMutation.isPending}
                        >
                          {deleteStudentMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      </div>
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default Students;
