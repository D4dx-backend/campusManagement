import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, Edit, Trash2, UserCog, Loader2, TrendingUp, UserX, Award, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, useSalaryIncrement, useStaffSeparation } from '@/hooks/useStaff';
import { staffService } from '@/services/staffService';
import { useDesignations } from '@/hooks/useDesignations';
import { useDepartments } from '@/hooks/useDepartments';
import { useStaffCategories } from '@/hooks/useStaffCategories';
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

  // New action dialogs
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [separationDialogOpen, setSeparationDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [salaryHistoryDialogOpen, setSalaryHistoryDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [salaryForm, setSalaryForm] = useState({ newSalary: '', effectiveDate: '', reason: '' });
  const [separationForm, setSeparationForm] = useState({ separationType: 'resigned' as 'terminated' | 'resigned', separationDate: '', lastWorkingDate: '', separationReason: '' });
  const [certData, setCertData] = useState<any>(null);
  const [salaryHistoryData, setSalaryHistoryData] = useState<any>(null);
  const certRef = useRef<HTMLDivElement>(null);

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
  const { data: categoriesResponse, isLoading: categoriesLoading } = useStaffCategories({ status: 'active', limit: 100 });

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();
  const salaryIncrementMutation = useSalaryIncrement();
  const separationMutation = useStaffSeparation();

  const designations = designationsResponse?.data || [];
  const departments = departmentsResponse?.data || [];
  const staffCategories = categoriesResponse?.data || [];

  // Filter configuration
  const filterOptions = [
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: staffCategories.filter((c: any) => c.name).map((c: any) => ({
        value: c.name,
        label: c.name
      }))
    },
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
    { key: 'category', label: 'Category' },
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
    category: '',
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
      category: '',
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
      category: staffMember.category || '',
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

  // ─── NEW ACTION HANDLERS ──────────────────────────────────────────────

  const handleSalaryIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    await salaryIncrementMutation.mutateAsync({
      id: selectedStaff._id,
      data: {
        newSalary: parseFloat(salaryForm.newSalary),
        effectiveDate: salaryForm.effectiveDate,
        reason: salaryForm.reason,
      },
    });
    setSalaryDialogOpen(false);
    setSalaryForm({ newSalary: '', effectiveDate: '', reason: '' });
  };

  const handleViewSalaryHistory = async (staffMember: any) => {
    setSelectedStaff(staffMember);
    try {
      const res = await staffService.getSalaryHistory(staffMember._id);
      setSalaryHistoryData(res.data);
      setSalaryHistoryDialogOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Failed to load salary history', variant: 'destructive' });
    }
  };

  const handleSeparation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    await separationMutation.mutateAsync({
      id: selectedStaff._id,
      data: separationForm,
    });
    setSeparationDialogOpen(false);
    setSeparationForm({ separationType: 'resigned', separationDate: '', lastWorkingDate: '', separationReason: '' });
  };

  const handleExperienceCertificate = async (staffMember: any) => {
    setSelectedStaff(staffMember);
    try {
      const res = await staffService.getExperienceCertificate(staffMember._id);
      setCertData(res.data);
      setCertDialogOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Failed to generate certificate', variant: 'destructive' });
    }
  };

  const handlePrintCertificate = () => {
    if (!certRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Experience Certificate</title>
      <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', 'Georgia', serif; }
        .cert-page {
          width: 210mm; min-height: 297mm; margin: 0 auto;
          padding: 20mm 25mm 25mm 25mm;
          position: relative;
        }
        .cert-border {
          border: 3px double #1a365d;
          padding: 15mm;
          min-height: 247mm;
          position: relative;
        }
        .cert-header { text-align: center; padding-bottom: 12mm; border-bottom: 2px solid #1a365d; margin-bottom: 10mm; }
        .cert-org-name { font-size: 26px; font-weight: bold; color: #1a365d; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
        .cert-branch-name { font-size: 16px; font-weight: 600; color: #2d4a7a; margin-bottom: 4px; }
        .cert-address { font-size: 12px; color: #555; margin-bottom: 2px; }
        .cert-ref-row { display: flex; justify-content: space-between; font-size: 12px; color: #333; margin-bottom: 8mm; }
        .cert-title-wrap { text-align: center; margin-bottom: 10mm; }
        .cert-title {
          font-size: 22px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;
          color: #1a365d; position: relative; display: inline-block; padding: 0 20px;
        }
        .cert-title::before, .cert-title::after {
          content: ''; position: absolute; top: 50%; width: 40px; height: 1px; background: #1a365d;
        }
        .cert-title::before { left: -45px; }
        .cert-title::after { right: -45px; }
        .cert-body { line-height: 2; font-size: 15px; text-align: justify; color: #222; }
        .cert-body p { margin-bottom: 6mm; }
        .cert-body strong { font-weight: bold; color: #000; }
        .cert-detail-table { width: 100%; border-collapse: collapse; margin: 6mm 0; }
        .cert-detail-table td { padding: 3mm 4mm; font-size: 14px; vertical-align: top; }
        .cert-detail-table td:first-child { width: 45%; font-weight: bold; color: #333; }
        .cert-detail-table td:last-child { color: #000; }
        .cert-detail-table tr:nth-child(odd) td { background: #f8fafc; }
        .cert-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; align-items: flex-end; }
        .cert-footer-left { font-size: 12px; color: #555; line-height: 1.8; }
        .cert-footer-right { text-align: center; }
        .cert-signature-line { width: 160px; border-top: 1px solid #333; margin-bottom: 4px; }
        .cert-footer-right p { font-size: 13px; }
        .cert-footer-right .name { font-weight: bold; color: #1a365d; font-size: 14px; }
        .cert-seal { text-align: center; margin-top: 8mm; font-size: 11px; color: #888; font-style: italic; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cert-page { margin: 0; }
        }
        @media screen { .cert-page { box-shadow: 0 2px 20px rgba(0,0,0,0.15); background: #fff; } }
      </style></head><body>
      ${certRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
      resigned: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
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
                <DialogDescription>
                  {editingStaff 
                    ? 'Update staff member information below.' 
                    : 'Enter staff member details to add them to the system.'}
                </DialogDescription>
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
                    <Label htmlFor="category">Staff Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          categoriesLoading
                            ? "Loading categories..."
                            : staffCategories.length === 0
                              ? "No categories available"
                              : "Select category"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading categories...
                            </div>
                          </SelectItem>
                        ) : staffCategories.length === 0 ? (
                          <SelectItem value="no-categories" disabled>
                            No categories available
                          </SelectItem>
                        ) : (
                          staffCategories.map((cat: any) => (
                            <SelectItem key={cat._id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Employee ID</th>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Category</th>
                  <th className="text-left p-3 font-semibold">Designation</th>
                  <th className="text-left p-3 font-semibold">Department</th>
                  <th className="text-left p-3 font-semibold">Phone</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Salary (BHD)</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((staffMember: any) => (
                  <tr key={staffMember._id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{staffMember.employeeId}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold">{staffMember.name}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{staffMember.category || '-'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{staffMember.designation}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{staffMember.department}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{staffMember.phone}</span>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(staffMember.status)}
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-medium">BHD {staffMember.salary.toFixed(3)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(staffMember)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedStaff(staffMember);
                              setSalaryForm({ newSalary: '', effectiveDate: '', reason: '' });
                              setSalaryDialogOpen(true);
                            }}>
                              <TrendingUp className="w-4 h-4 mr-2" /> Salary Increment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewSalaryHistory(staffMember)}>
                              <TrendingUp className="w-4 h-4 mr-2" /> Salary History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExperienceCertificate(staffMember)}>
                              <Award className="w-4 h-4 mr-2" /> Experience Certificate
                            </DropdownMenuItem>
                            {staffMember.status === 'active' && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedStaff(staffMember);
                                setSeparationForm({ separationType: 'resigned', separationDate: '', lastWorkingDate: '', separationReason: '' });
                                setSeparationDialogOpen(true);
                              }}>
                                <UserX className="w-4 h-4 mr-2" /> Terminate / Resign
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(staffMember._id, staffMember.name)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      </div>

      {/* ─── SALARY INCREMENT DIALOG ───────────────────────────────────── */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salary Increment</DialogTitle>
            <DialogDescription>
              Record salary increment for {selectedStaff?.name}. Current salary: BHD {selectedStaff?.salary?.toFixed(3)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalaryIncrement} className="space-y-4">
            <div className="space-y-2">
              <Label>New Salary (BHD) *</Label>
              <Input
                type="number"
                step="0.001"
                value={salaryForm.newSalary}
                onChange={(e) => setSalaryForm({ ...salaryForm, newSalary: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Input
                type="date"
                value={salaryForm.effectiveDate}
                onChange={(e) => setSalaryForm({ ...salaryForm, effectiveDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={salaryForm.reason}
                onChange={(e) => setSalaryForm({ ...salaryForm, reason: e.target.value })}
                placeholder="e.g., Annual increment, Performance bonus"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSalaryDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={salaryIncrementMutation.isPending}>
                {salaryIncrementMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Apply Increment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── SALARY HISTORY DIALOG ─────────────────────────────────────── */}
      <Dialog open={salaryHistoryDialogOpen} onOpenChange={setSalaryHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Salary History</DialogTitle>
            <DialogDescription>
              {salaryHistoryData?.name} ({salaryHistoryData?.employeeId}) — Current: BHD {salaryHistoryData?.currentSalary?.toFixed(3)}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {salaryHistoryData?.history?.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-right">Previous</th>
                    <th className="p-2 text-right">New</th>
                    <th className="p-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistoryData.history.map((h: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{new Date(h.effectiveDate).toLocaleDateString()}</td>
                      <td className="p-2 text-right">BHD {h.previousSalary?.toFixed(3)}</td>
                      <td className="p-2 text-right font-medium">BHD {h.newSalary?.toFixed(3)}</td>
                      <td className="p-2 text-muted-foreground">{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No salary history found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── SEPARATION DIALOG ─────────────────────────────────────────── */}
      <Dialog open={separationDialogOpen} onOpenChange={setSeparationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Separation</DialogTitle>
            <DialogDescription>
              Record termination or resignation for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSeparation} className="space-y-4">
            <div className="space-y-2">
              <Label>Separation Type *</Label>
              <Select
                value={separationForm.separationType}
                onValueChange={(v: 'terminated' | 'resigned') => setSeparationForm({ ...separationForm, separationType: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resigned">Resigned</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Separation Date *</Label>
              <Input
                type="date"
                value={separationForm.separationDate}
                onChange={(e) => setSeparationForm({ ...separationForm, separationDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Working Date *</Label>
              <Input
                type="date"
                value={separationForm.lastWorkingDate}
                onChange={(e) => setSeparationForm({ ...separationForm, lastWorkingDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={separationForm.separationReason}
                onChange={(e) => setSeparationForm({ ...separationForm, separationReason: e.target.value })}
                placeholder="Reason for separation"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSeparationDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={separationMutation.isPending}>
                {separationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm {separationForm.separationType === 'terminated' ? 'Termination' : 'Resignation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── EXPERIENCE CERTIFICATE DIALOG ─────────────────────────────── */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Experience Certificate</DialogTitle>
            <DialogDescription>Preview and print the experience certificate</DialogDescription>
          </DialogHeader>
          {certData && (
            <>
              <div ref={certRef} className="bg-white text-black">
                <div className="cert-page" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '20mm 25mm 25mm 25mm', position: 'relative', fontFamily: "'Times New Roman', Georgia, serif" }}>
                  <div className="cert-border" style={{ border: '3px double #1a365d', padding: '40px', minHeight: '700px', position: 'relative' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '2px solid #1a365d', marginBottom: '20px' }}>
                      <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1a365d', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {certData.organizationName}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#2d4a7a', marginBottom: '4px' }}>
                        {certData.branchName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555' }}>
                        {certData.branchAddress}
                      </div>
                    </div>

                    {/* Reference & Date Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#333', marginBottom: '20px' }}>
                      <span>Ref. No: {certData.employeeId || '___________'}</span>
                      <span>Date: {new Date(certData.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase', color: '#1a365d', borderBottom: '2px solid #1a365d', paddingBottom: '4px' }}>
                        Experience Certificate
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ lineHeight: 2, fontSize: '15px', textAlign: 'justify', color: '#222' }}>
                      <p style={{ marginBottom: '16px' }}>
                        This is to certify that <strong style={{ color: '#000' }}>{certData.staffName}</strong> has been employed at{' '}
                        <strong style={{ color: '#000' }}>{certData.organizationName}, {certData.branchName}</strong> in the capacity detailed below:
                      </p>

                      {/* Details Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              Name of the Employee
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', borderBottom: '1px solid #e2e8f0' }}>
                              {certData.staffName}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', borderBottom: '1px solid #e2e8f0' }}>
                              Employee ID
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', borderBottom: '1px solid #e2e8f0' }}>
                              {certData.employeeId}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              Designation / Position
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', borderBottom: '1px solid #e2e8f0' }}>
                              {certData.designation}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', borderBottom: '1px solid #e2e8f0' }}>
                              Department
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', borderBottom: '1px solid #e2e8f0' }}>
                              {certData.department}
                            </td>
                          </tr>
                          {certData.category && (
                            <tr>
                              <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                Category
                              </td>
                              <td style={{ padding: '8px 12px', color: '#000', borderBottom: '1px solid #e2e8f0' }}>
                                {certData.category}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', background: certData.category ? undefined : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              Date of Joining (From)
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                              {new Date(certData.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', borderBottom: '1px solid #e2e8f0' }}>
                              Last Working Date (To)
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>
                              {new Date(certData.lastWorkingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#333', width: '45%', background: '#f8fafc' }}>
                              Total Duration of Service
                            </td>
                            <td style={{ padding: '8px 12px', color: '#000', fontWeight: 'bold' }}>
                              {certData.duration}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style={{ marginTop: '20px', marginBottom: '12px' }}>
                        During the period of employment, we found the conduct and character of{' '}
                        <strong style={{ color: '#000' }}>{certData.staffName}</strong> to be good and satisfactory.
                        The performance has been commendable and up to the expectations of the institution.
                      </p>

                      <p style={{ marginBottom: '12px' }}>
                        We wish <strong style={{ color: '#000' }}>{certData.staffName}</strong> all the very best in future endeavors.
                      </p>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.8 }}>
                        <p>Place: {certData.branchAddress?.split(',').pop()?.trim()}</p>
                        <p>Date: {new Date(certData.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '160px', borderTop: '1px solid #333', marginBottom: '4px' }}></div>
                        <p style={{ fontWeight: 'bold', color: '#1a365d', fontSize: '14px' }}>
                          {certData.principalName || 'Principal / Head of Institution'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#555' }}>{certData.organizationName}</p>
                        <p style={{ fontSize: '11px', color: '#888' }}>{certData.branchName}</p>
                      </div>
                    </div>

                    {/* Seal note */}
                    <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                      This is a computer-generated document. Valid with authorized signature and institution seal.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setCertDialogOpen(false)}>Close</Button>
                <Button onClick={handlePrintCertificate}>Print Certificate</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationComponent />
    </AppLayout>
  );
};

export default Staff;