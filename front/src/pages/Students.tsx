import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { DataTable } from '@/components/ui/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { PromoteStudentsDialog } from '@/components/students/PromoteStudentsDialog';
import { TransferCertificateDialog } from '@/components/students/TransferCertificateDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, Edit, Trash2, UserCircle, Loader2, ArrowUpCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useDivisionsByClass } from '@/hooks/useDivisions';
import { useBranches } from '@/hooks/useBranches';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';
import { studentService } from '@/services/studentService';
import { formatters } from '@/utils/exportUtils';
import { createApiFilters, filterMappings, createExportDataFetcher } from '@/utils/apiFilters';
import { useAuth } from '@/contexts/AuthContext';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<any>(null);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [admissionNoLoading, setAdmissionNoLoading] = useState(false);
  // Tracks which class+division combo we last generated for — prevents double-fire
  const generatedForRef = useRef<{ class: string; section: string } | null>(null);
  const { user } = useAuth();
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
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherJobCompany: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    motherJobCompany: '',
    gender: '' as 'male' | 'female' | '',
    address: '',
    transport: 'none' as 'school' | 'own' | 'none',
    transportRoute: '',
    isStaffChild: false,
  });

  // API hooks for classes and divisions
  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];
  const getBranchName = (branchId: string) => {
    const branch = branches.find((b: any) => (b.id || b._id) === branchId);
    return branch ? branch.name : '';
  };

  const { data: classesResponse } = useClasses({ status: 'active', limit: 100 });
  const { data: divisionsResponse, isLoading: divisionsLoading, isSuccess: divisionsLoaded, error: divisionsError } = useDivisionsByClass(formData.class);
  const selectedFilterClassId = (filterValues as any).class || '';
  const { data: filterDivisionsResponse } = useDivisionsByClass(selectedFilterClassId);
  const { data: transportRoutesResponse } = useTransportRoutes({ status: 'active', limit: 100 });

  const classes = classesResponse?.data || [];
  const divisions = divisionsResponse?.data || [];
  const filterDivisions = filterDivisionsResponse?.data || [];
  const transportRoutes = transportRoutesResponse?.data || [];
  const selectedBranchId = (filterValues as any).branch;
  const branchOptions = (branches.length > 0
    ? branches
        .filter((branch: any) => (branch.id || branch._id) && branch.name)
        .map((branch: any) => ({
          value: branch.id || branch._id,
          label: branch.name
        }))
    : user?.branchId
      ? [{ value: user.branchId, label: 'My Branch' }]
      : []
  );
  const classFilterSource = selectedBranchId
    ? classes.filter((cls: any) => cls.branchId === selectedBranchId)
    : classes;

  // Derive branch name from selected class
  const selectedClass = classes.find((cls: any) => cls._id === formData.class);
  const selectedClassBranchName = selectedClass ? getBranchName(selectedClass.branchId) : '';

  // Filter configuration
  const filterOptions = [
    {
      key: 'branch',
      label: 'Branch',
      type: 'select' as const,
      options: branchOptions
    },
    {
      key: 'class',
      label: 'Class',
      type: 'select' as const,
      options: classFilterSource.filter((cls: any) => cls._id && cls.name).map((cls: any) => {
        const branchName = getBranchName(cls.branchId);
        return {
          value: cls._id,
          label: `${cls.name} (${cls.academicYear})${branchName ? ` — ${branchName}` : ''}`
        };
      })
    },
    {
      key: 'section',
      label: 'Division',
      type: 'select' as const,
      options: selectedFilterClassId
        ? filterDivisions
            .filter((division: any) => division.name)
            .map((division: any) => ({
              value: division.name,
              label: `Division ${division.name}`
            }))
        : []
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
      fatherName: '',
      fatherPhone: '',
      fatherEmail: '',
      fatherJobCompany: '',
      motherName: '',
      motherPhone: '',
      motherEmail: '',
      motherJobCompany: '',
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
      const validSections = divisions.map(d => d.name);
      if (!validSections.includes(formData.section)) {
        setFormData(prev => ({ ...prev, section: '' }));
      }
    }
  }, [formData.class, divisions]);

  // Reset ref + clear admission no whenever class changes (new student only)
  useEffect(() => {
    if (editingStudent) return;
    generatedForRef.current = null;
    setFormData(prev => ({ ...prev, admissionNo: '' }));
  }, [formData.class, editingStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate admission number once divisions have actually loaded (isSuccess ensures real fetch completed)
  useEffect(() => {
    if (editingStudent || !formData.class || !divisionsLoaded) return;

    const section = divisions.length === 0 ? '' : formData.section;

    // For classes that have divisions, wait for a section to be picked
    if (divisions.length > 0 && !formData.section) return;

    // Skip if we already generated for this exact class+section combo
    const prev = generatedForRef.current;
    if (prev && prev.class === formData.class && prev.section === section) return;

    generatedForRef.current = { class: formData.class, section };
    setAdmissionNoLoading(true);
    studentService.getNextAdmissionNo(formData.class, section)
      .then(admissionNo => setFormData(p => ({ ...p, admissionNo })))
      .catch(() => { generatedForRef.current = null; })
      .finally(() => setAdmissionNoLoading(false));
  }, [formData.class, formData.section, editingStudent, divisionsLoaded, divisions.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
      class: student.classId || student.class,
      section: student.section,
      dateOfBirth: student.dateOfBirth.split('T')[0],
      dateOfAdmission: student.dateOfAdmission ? student.dateOfAdmission.split('T')[0] : '',
      fatherName: student.fatherName || student.guardianName || '',
      fatherPhone: student.fatherPhone || student.guardianPhone || '',
      fatherEmail: student.fatherEmail || student.guardianEmail || '',
      fatherJobCompany: student.fatherJobCompany || '',
      motherName: student.motherName || '',
      motherPhone: student.motherPhone || '',
      motherEmail: student.motherEmail || '',
      motherJobCompany: student.motherJobCompany || '',
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
    const nextValues = { ...values };
    if (nextValues.branch && nextValues.class) {
      const selectedClassForFilter = classes.find((cls: any) => cls._id === nextValues.class);
      if (selectedClassForFilter && selectedClassForFilter.branchId !== nextValues.branch) {
        nextValues.class = '';
        nextValues.section = '';
      }
    }
    if (nextValues.class !== (filterValues as any).class) {
      nextValues.section = '';
    }
    setFilterValues(nextValues);
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

  const handleSelectStudent = (student: any, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, student]);
    } else {
      setSelectedStudents(selectedStudents.filter(s => s._id !== student._id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(studentsResponse?.data || []);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleTransferClick = (student: any) => {
    setTransferStudent(student);
    setIsTransferDialogOpen(true);
  };

  const refreshStudents = () => {
    // The query will automatically refetch
    setSelectedStudents([]);
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
          <div className="flex gap-2">
            {selectedStudents.length > 0 && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsPromoteDialogOpen(true)}
              >
                <ArrowUpCircle className="w-4 h-4" />
                Promote ({selectedStudents.length})
              </Button>
            )}
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
                    <div className="relative">
                      <Input
                        id="admissionNo"
                        value={formData.admissionNo}
                        readOnly
                        placeholder={!editingStudent ? 'Auto-generated after class selection' : ''}
                        className="bg-muted cursor-not-allowed"
                        required
                      />
                      {admissionNoLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
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
                        {classes.map((cls: any) => {
                          const branchName = getBranchName(cls.branchId);
                          return (
                            <SelectItem key={cls._id} value={cls._id}>
                              {cls.name} ({cls.academicYear}){branchName ? ` — ${branchName}` : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={selectedClassBranchName}
                      readOnly
                      placeholder="Auto-filled from class"
                      className="bg-muted cursor-not-allowed"
                    />
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
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPhone">Father's Phone *</Label>
                    <PhoneInput
                      id="fatherPhone"
                      value={formData.fatherPhone}
                      onChange={(value) => setFormData({ ...formData, fatherPhone: value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherEmail">Father's Email</Label>
                    <Input
                      id="fatherEmail"
                      type="email"
                      value={formData.fatherEmail}
                      onChange={e => setFormData({ ...formData, fatherEmail: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="fatherJobCompany">Father's Job & Company</Label>
                    <Input
                      id="fatherJobCompany"
                      placeholder="e.g., Software Engineer at ABC Corp"
                      value={formData.fatherJobCompany}
                      onChange={e => setFormData({ ...formData, fatherJobCompany: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherPhone">Mother's Phone</Label>
                    <PhoneInput
                      id="motherPhone"
                      value={formData.motherPhone}
                      onChange={(value) => setFormData({ ...formData, motherPhone: value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherEmail">Mother's Email</Label>
                    <Input
                      id="motherEmail"
                      type="email"
                      value={formData.motherEmail}
                      onChange={e => setFormData({ ...formData, motherEmail: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="motherJobCompany">Mother's Job & Company</Label>
                    <Input
                      id="motherJobCompany"
                      placeholder="e.g., Teacher at XYZ School"
                      value={formData.motherJobCompany}
                      onChange={e => setFormData({ ...formData, motherJobCompany: e.target.value })}
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
                  <th className="text-left p-3 font-semibold w-12">
                    <Checkbox
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold">Admission No</th>
                  <th className="text-left p-3 font-semibold">Student Name</th>
                  <th className="text-left p-3 font-semibold">Class</th>
                  <th className="text-left p-3 font-semibold">Father's Name</th>
                  <th className="text-left p-3 font-semibold">Father's Phone</th>
                  <th className="text-left p-3 font-semibold">Gender</th>
                  <th className="text-left p-3 font-semibold">Transport</th>
                  <th className="text-left p-3 font-semibold">Staff Child</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr
                    key={student._id}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => setViewingStudent(student)}
                  >
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedStudents.some(s => s._id === student._id)}
                        onCheckedChange={(checked) => handleSelectStudent(student, checked as boolean)}
                      />
                    </td>
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
                      <span className="text-sm">{student.fatherName || student.guardianName || '—'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{student.fatherPhone || student.guardianPhone || '—'}</span>
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
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransferClick(student)}
                          title="Generate Transfer Certificate"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
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

      {/* Promote Students Dialog */}
      <PromoteStudentsDialog
        open={isPromoteDialogOpen}
        onOpenChange={setIsPromoteDialogOpen}
        selectedStudents={selectedStudents}
        onSuccess={refreshStudents}
        classes={classes}
        divisions={divisions}
      />

      {/* Transfer Certificate Dialog */}
      <TransferCertificateDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        student={transferStudent}
        onSuccess={refreshStudents}
      />

      {/* Student Detail View */}
      <Dialog open={!!viewingStudent} onOpenChange={(open) => { if (!open) setViewingStudent(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>{viewingStudent?.admissionNo}</DialogDescription>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4 text-sm">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-base mb-2 border-b pb-1">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Full Name</span><p className="font-medium">{viewingStudent.name}</p></div>
                  <div><span className="text-muted-foreground">Admission No</span><p className="font-medium">{viewingStudent.admissionNo}</p></div>
                  <div><span className="text-muted-foreground">Class</span><p className="font-medium">{viewingStudent.class}{viewingStudent.section ? ` — ${viewingStudent.section}` : ''}</p></div>
                  <div><span className="text-muted-foreground">Branch</span><p className="font-medium">{(() => { const cls = classes.find((c: any) => c._id === (viewingStudent.classId || viewingStudent.class)); return cls ? getBranchName(cls.branchId) : '—'; })()}</p></div>
                  <div><span className="text-muted-foreground">Gender</span><p className="font-medium capitalize">{viewingStudent.gender}</p></div>
                  <div><span className="text-muted-foreground">Date of Birth</span><p className="font-medium">{new Date(viewingStudent.dateOfBirth).toLocaleDateString()}</p></div>
                  <div><span className="text-muted-foreground">Date of Admission</span><p className="font-medium">{viewingStudent.dateOfAdmission ? new Date(viewingStudent.dateOfAdmission).toLocaleDateString() : '—'}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Address</span><p className="font-medium">{viewingStudent.address}</p></div>
                </div>
              </div>
              {/* Father's Info */}
              <div>
                <h3 className="font-semibold text-base mb-2 border-b pb-1">Father's Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Name</span><p className="font-medium">{viewingStudent.fatherName || viewingStudent.guardianName || '—'}</p></div>
                  <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{viewingStudent.fatherPhone || viewingStudent.guardianPhone || '—'}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{viewingStudent.fatherEmail || viewingStudent.guardianEmail || '—'}</p></div>
                  <div><span className="text-muted-foreground">Job & Company</span><p className="font-medium">{viewingStudent.fatherJobCompany || '—'}</p></div>
                </div>
              </div>
              {/* Mother's Info */}
              <div>
                <h3 className="font-semibold text-base mb-2 border-b pb-1">Mother's Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Name</span><p className="font-medium">{viewingStudent.motherName || '—'}</p></div>
                  <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{viewingStudent.motherPhone || '—'}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{viewingStudent.motherEmail || '—'}</p></div>
                  <div><span className="text-muted-foreground">Job & Company</span><p className="font-medium">{viewingStudent.motherJobCompany || '—'}</p></div>
                </div>
              </div>
              {/* Transport & Other */}
              <div>
                <h3 className="font-semibold text-base mb-2 border-b pb-1">Other Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Transport</span><p className="font-medium capitalize">{viewingStudent.transport}</p></div>
                  {viewingStudent.transportRoute && <div><span className="text-muted-foreground">Route</span><p className="font-medium">{viewingStudent.transportRoute}</p></div>}
                  <div><span className="text-muted-foreground">Staff Child</span><p className="font-medium">{viewingStudent.isStaffChild ? 'Yes' : 'No'}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p className="font-medium capitalize">{viewingStudent.status}</p></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewingStudent(null)}>Close</Button>
                <Button onClick={() => { setViewingStudent(null); handleEdit(viewingStudent); }}>Edit Student</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Students;
