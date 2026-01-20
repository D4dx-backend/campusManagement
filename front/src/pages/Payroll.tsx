import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Search, Receipt, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePayrollEntries, useCreatePayrollEntry, usePayrollStats } from '@/hooks/usePayroll';
import { useStaff } from '@/hooks/useStaff';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';


const PayrollContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();

  // API hooks - only pass basic parameters
  const { data: payrollResponse, isLoading, error } = usePayrollEntries({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  });

  const { data: staffResponse } = useStaff({ limit: 100 }); // Get staff for dropdown
  const { data: statsResponse } = usePayrollStats();
  const createPayrollMutation = useCreatePayrollEntry();



  // Early return if there's a critical error
  if (error && (error as any).response?.status === 401) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Authentication error. Please log in again.</p>
      </div>
    );
  }



  const [formData, setFormData] = useState({
    staffId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    allowances: '',
    deductions: '',
    paymentMethod: 'bank' as 'cash' | 'bank',
  });

  const resetForm = () => {
    setFormData({
      staffId: '',
      month: '',
      year: new Date().getFullYear().toString(),
      allowances: '',
      deductions: '',
      paymentMethod: 'bank',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPayrollMutation.mutateAsync({
        staffId: formData.staffId,
        month: formData.month,
        year: Number(formData.year),
        allowances: Number(formData.allowances) || 0,
        deductions: Number(formData.deductions) || 0,
        paymentMethod: formData.paymentMethod,
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  // Get data from API (server-side filtered and paginated)
  const payrollEntries = (payrollResponse?.data || []) as any[];
  const staff = (staffResponse?.data || []) as any[];
  const statsData = statsResponse?.data?.totalEntries !== undefined ? statsResponse.data : (statsResponse || {
    totalPaid: 0,
    thisMonthTotal: 0,
    totalEntries: 0, 
    thisMonthEntries: 0,
    totalAmountPaid: 0
  });
  const stats = statsData as { totalPaid: number; thisMonthTotal: number; totalEntries: number; thisMonthEntries: number; totalAmountPaid: number };

  const pagination = payrollResponse?.pagination;

  // Get configuration from templates
  const config = pageConfigurations.payroll;
  
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

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground mt-1">Manage staff salary payments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Process Salary
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Staff Salary</DialogTitle>
                <DialogDescription>
                  Enter salary details to process payroll for the selected staff member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Select Staff Member *</Label>
                  <Select
                    value={formData.staffId}
                    onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff?.map(s => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} - {s.designation} (₹{s.salary?.toLocaleString() || 0})
                        </SelectItem>
                      )) || []}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month *</Label>
                    <Select
                      value={formData.month}
                      onValueChange={(value) => setFormData({ ...formData, month: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allowances">Allowances</Label>
                    <Input
                      id="allowances"
                      type="number"
                      value={formData.allowances}
                      onChange={e => setFormData({ ...formData, allowances: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input
                      id="deductions"
                      type="number"
                      value={formData.deductions}
                      onChange={e => setFormData({ ...formData, deductions: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.staffId && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Salary Calculation:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span>₹{staff?.find(s => s._id === formData.staffId)?.salary?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances:</span>
                        <span className="text-green-600">+₹{(Number(formData.allowances) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span className="text-destructive">-₹{(Number(formData.deductions) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Net Salary:</span>
                        <span>₹{((staff?.find(s => s._id === formData.staffId)?.salary || 0) + (Number(formData.allowances) || 0) - (Number(formData.deductions) || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPayrollMutation.isPending}>
                    {createPayrollMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Process Salary
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats.totalPaid || stats.totalAmountPaid || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats.totalEntries || 0} entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats.thisMonthTotal || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats.thisMonthEntries || 0} staff paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{staff?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">total staff members</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          searchPlaceholder="Search by staff name or month..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'payroll',
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
          data={payrollEntries}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No payroll entries found"
          }}
        >
          <div className="grid gap-4">
            {payrollEntries?.map(entry => (
              <Card key={entry._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{entry.staff?.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {entry.month} {entry.year}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Basic:</span>
                          <span className="ml-2 font-medium">₹{(entry.basicSalary || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Allowances:</span>
                          <span className="ml-2 font-medium text-green-600">+₹{(entry.allowances || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deductions:</span>
                          <span className="ml-2 font-medium text-destructive">-₹{(entry.deductions || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Salary:</span>
                          <span className="ml-2 font-bold text-primary">₹{(entry.netSalary || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Paid:</span>
                          <span className="ml-2 font-medium">{entry.paymentDate ? new Date(entry.paymentDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>
    </div>
  );
};

const Payroll = () => {
  return (
    <ErrorBoundary>
      <AppLayout>
        <PayrollContent />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Payroll;
