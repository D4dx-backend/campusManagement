import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Search, Receipt, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFeePayments, useCreateFeePayment, useFeeStats } from '@/hooks/useFees';
import { useStudents } from '@/hooks/useStudents';

import { formatters } from '@/utils/exportUtils';
import { downloadReceipt } from '@/utils/receiptGenerator';
import { receiptService } from '@/services/receiptService';

const Fees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();

  // API hooks - only pass basic parameters
  const { data: paymentsResponse, isLoading, error } = useFeePayments({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  });

  const { data: studentsResponse } = useStudents({ limit: 100 }); // Get students for dropdown
  const { data: statsResponse } = useFeeStats();
  const createPaymentMutation = useCreateFeePayment();

  const [formData, setFormData] = useState({
    studentId: '',
    feeType: 'tuition' as 'tuition' | 'transport' | 'cocurricular' | 'maintenance' | 'exam' | 'textbook',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'online',
    remarks: '',
  });

  const resetForm = () => {
    setFormData({
      studentId: '',
      feeType: 'tuition',
      amount: '',
      paymentMethod: 'cash',
      remarks: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPaymentMutation.mutateAsync({
        studentId: formData.studentId,
        feeType: formData.feeType,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        remarks: formData.remarks,
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  // Get raw data from API
  const rawPayments = paymentsResponse?.data || [];
  
  // Apply frontend filters
  const payments = rawPayments.filter((payment: any) => {
    // Apply fee type filter
    if (filterValues.feeType && payment.feeType !== filterValues.feeType) {
      return false;
    }
    
    // Apply payment method filter
    if (filterValues.paymentMethod && payment.paymentMethod !== filterValues.paymentMethod) {
      return false;
    }
    
    // Apply date range filter
    if (filterValues.paymentDate_from) {
      const paymentDate = new Date(payment.paymentDate);
      const fromDate = new Date(filterValues.paymentDate_from);
      if (paymentDate < fromDate) return false;
    }
    
    if (filterValues.paymentDate_to) {
      const paymentDate = new Date(payment.paymentDate);
      const toDate = new Date(filterValues.paymentDate_to);
      if (paymentDate > toDate) return false;
    }
    
    // Apply amount filter (minimum amount)
    if (filterValues.amount && payment.amount < parseFloat(filterValues.amount)) {
      return false;
    }
    
    return true;
  });
  const students = studentsResponse?.data || [];
  const pagination = paymentsResponse?.pagination;
  const stats = statsResponse?.data;

  // Handle receipt download
  const handleDownloadReceipt = async (payment: any) => {
    try {
      // Get receipt data from API
      const response = await receiptService.getReceiptData(payment._id);
      
      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || "Failed to get receipt data",
          variant: "destructive",
        });
        return;
      }

      await downloadReceipt(response.data);
      
      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter configuration
  const filterOptions = [
    {
      key: 'feeType',
      label: 'Fee Type',
      type: 'select' as const,
      options: [
        { value: 'tuition', label: 'Tuition Fee' },
        { value: 'transport', label: 'Transport Fee' },
        { value: 'cocurricular', label: 'Co-curricular Fee' },
        { value: 'maintenance', label: 'Maintenance Fee' },
        { value: 'exam', label: 'Exam Fee' },
        { value: 'textbook', label: 'Text Book Charges' }
      ]
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'select' as const,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'online', label: 'Online Payment' }
      ]
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      type: 'dateRange' as const
    },
    {
      key: 'amount',
      label: 'Amount Range',
      type: 'number' as const,
      placeholder: 'Minimum amount'
    }
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'receiptNo', label: 'Receipt No' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'class', label: 'Class' },
    { key: 'feeType', label: 'Fee Type', formatter: formatters.capitalize },
    { key: 'amount', label: 'Amount', formatter: formatters.currency },
    { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
    { key: 'paymentDate', label: 'Payment Date', formatter: formatters.date },
    { key: 'remarks', label: 'Remarks' }
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

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load fee payments</p>
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
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-muted-foreground mt-1">Collect and manage student fees</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Collect Fee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Fee Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Select Student *</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student._id} value={student._id}>
                          {student.name} - {student.class} ({student.admissionNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feeType">Fee Type *</Label>
                  <Select
                    value={formData.feeType}
                    onValueChange={(value: any) => setFormData({ ...formData, feeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">Tuition Fee</SelectItem>
                      <SelectItem value="transport">Transport Fee</SelectItem>
                      <SelectItem value="cocurricular">Co-curricular Fee</SelectItem>
                      <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                      <SelectItem value="exam">Exam Fee</SelectItem>
                      <SelectItem value="textbook">Text Book Charges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
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
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Record Payment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats?.totalCollection?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats?.totalCollection?.count || 0} payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats?.monthlyCollection?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats?.monthlyCollection?.count || 0} payments this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats?.dailyCollection?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats?.dailyCollection?.count || 0} payments today</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          searchPlaceholder="Search by student name, receipt no, or class..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'fee_payments',
            columns: exportColumns
          }}
          pagination={{
            currentPage,
            totalPages: pagination?.pages || 1,
            totalItems: pagination?.total || 0,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          data={payments}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No fee payments recorded"
          }}
        >
          <div className="grid gap-4">
            {payments.map((payment: any) => (
              <Card key={payment._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{payment.studentName}</h3>
                        <span className="text-sm text-muted-foreground">
                          {payment.receiptNo}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <span className="ml-2 font-medium">{payment.class}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fee Type:</span>
                          <span className="ml-2 font-medium capitalize">{payment.feeType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 font-medium text-secondary">₹{payment.amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <span className="ml-2 font-medium capitalize">{payment.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <span className="ml-2 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadReceipt(payment)}
                      title="Download Receipt"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>
      </div>
    </AppLayout>
  );
};

export default Fees;
