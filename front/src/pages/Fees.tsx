import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Search, Receipt, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFeePayments, useCreateFeePayment, useFeeStats } from '@/hooks/useFees';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import feeStructureService, { FeeStructure } from '@/services/feeStructureService';

import { formatters } from '@/utils/exportUtils';
import { downloadReceipt } from '@/utils/receiptGenerator';
import { receiptService } from '@/services/receiptService';

interface FeeItem {
  feeStructureId: string;
  title: string;
  feeType: string;
  amount: number;
  transportDistanceGroup?: string;
}

const Fees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: branchesResponse } = useBranches();
  const branches = branchesResponse?.data || [];

  // API hooks - only pass basic parameters
  const { data: paymentsResponse, isLoading, error } = useFeePayments({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined
  });

  const { data: studentsResponse } = useStudents({ limit: 100 }); // Get students for dropdown
  const { data: statsResponse } = useFeeStats();
  const createPaymentMutation = useCreateFeePayment();

  const [formData, setFormData] = useState({
    studentId: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'online',
    remarks: '',
  });

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [availableFees, setAvailableFees] = useState<FeeStructure[]>([]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [transportDistanceGroups, setTransportDistanceGroups] = useState<Record<string, string>>({});
  const [loadingFees, setLoadingFees] = useState(false);

  // Load fee structures when student is selected
  useEffect(() => {
    if (formData.studentId) {
      const student = students.find((s: any) => s._id === formData.studentId);
      setSelectedStudent(student);
      
      if (student?.classId) {
        loadFeeStructures(student.classId);
      }
    } else {
      setSelectedStudent(null);
      setAvailableFees([]);
      setSelectedFees(new Set());
      setTransportDistanceGroups({});
    }
  }, [formData.studentId]);

  const loadFeeStructures = async (classId: string) => {
    setLoadingFees(true);
    try {
      const response = await feeStructureService.getFeeStructuresByClass(classId);
      if (response.success) {
        setAvailableFees(response.data.feeStructures || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load fee structures",
        variant: "destructive",
      });
    } finally {
      setLoadingFees(false);
    }
  };

  const handleFeeToggle = (feeId: string) => {
    const newSelected = new Set(selectedFees);
    if (newSelected.has(feeId)) {
      newSelected.delete(feeId);
      // Remove transport distance group if unchecked
      const fee = availableFees.find(f => f._id === feeId);
      if (fee?.feeType === 'transport') {
        const newGroups = { ...transportDistanceGroups };
        delete newGroups[feeId];
        setTransportDistanceGroups(newGroups);
      }
    } else {
      newSelected.add(feeId);
    }
    setSelectedFees(newSelected);
  };

  const handleDistanceGroupChange = (feeId: string, group: string) => {
    setTransportDistanceGroups({
      ...transportDistanceGroups,
      [feeId]: group
    });
  };

  const calculateTotal = (): number => {
    return Array.from(selectedFees).reduce((total, feeId) => {
      const fee = availableFees.find(f => f._id === feeId);
      if (!fee) return total;

      // For transport fees, need to find the specific distance group fee
      if (fee.feeType === 'transport') {
        const selectedGroup = transportDistanceGroups[feeId];
        const transportFee = availableFees.find(
          f => f.feeType === 'transport' && 
               f.classId === fee.classId && 
               f.transportDistanceGroup === selectedGroup
        );
        if (!transportFee) return total;
        
        // Apply staff discount if applicable
        let amount = transportFee.amount;
        if (selectedStudent?.isStaffChild && transportFee.staffDiscountPercent) {
          amount = amount - (amount * transportFee.staffDiscountPercent / 100);
        }
        return total + amount;
      }

      // Apply staff discount for regular fees if applicable
      let amount = fee.amount;
      if (selectedStudent?.isStaffChild && fee.staffDiscountPercent) {
        amount = amount - (amount * fee.staffDiscountPercent / 100);
      }
      
      return total + amount;
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      paymentMethod: 'cash',
      remarks: '',
    });
    setSelectedFees(new Set());
    setTransportDistanceGroups({});
    setSelectedStudent(null);
    setAvailableFees([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFees.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one fee to collect",
        variant: "destructive",
      });
      return;
    }

    // Build fee items array
    const feeItems: FeeItem[] = [];
    
    for (const feeId of selectedFees) {
      const fee = availableFees.find(f => f._id === feeId);
      if (!fee) continue;

      if (fee.feeType === 'transport') {
        const selectedGroup = transportDistanceGroups[feeId];
        if (!selectedGroup) {
          toast({
            title: "Error",
            description: "Please select distance group for transport fee",
            variant: "destructive",
          });
          return;
        }
        
        const transportFee = availableFees.find(
          f => f.feeType === 'transport' && 
               f.classId === fee.classId && 
               f.transportDistanceGroup === selectedGroup
        );

        if (transportFee) {
          // Apply staff discount if applicable
          let amount = transportFee.amount;
          if (selectedStudent?.isStaffChild && transportFee.staffDiscountPercent) {
            amount = amount - (amount * transportFee.staffDiscountPercent / 100);
          }
          
          feeItems.push({
            feeStructureId: transportFee._id,
            title: transportFee.title,
            feeType: transportFee.feeType,
            amount: Math.round(amount),
            transportDistanceGroup: transportFee.transportDistanceGroup
          });
        }
      } else {
        // Apply staff discount if applicable
        let amount = fee.amount;
        if (selectedStudent?.isStaffChild && fee.staffDiscountPercent) {
          amount = amount - (amount * fee.staffDiscountPercent / 100);
        }
        
        feeItems.push({
          feeStructureId: fee._id,
          title: fee.title,
          feeType: fee.feeType,
          amount: Math.round(amount)
        });
      }
    }
    
    try {
      await createPaymentMutation.mutateAsync({
        studentId: formData.studentId,
        feeItems,
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
    // Apply fee type filter - check within feeItems if they exist
    if (filterValues.feeType) {
      if (payment.feeItems && payment.feeItems.length > 0) {
        // Check if any fee item matches the filter
        const hasMatchingFeeType = payment.feeItems.some((item: any) => item.feeType === filterValues.feeType);
        if (!hasMatchingFeeType) return false;
      } else if (payment.feeType !== filterValues.feeType) {
        // Backward compatibility for old records
        return false;
      }
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
    
    // Apply amount filter (minimum amount) - use totalAmount if available
    const amount = payment.totalAmount || payment.amount;
    if (filterValues.amount && amount < parseFloat(filterValues.amount)) {
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
    { key: 'class', label: 'Class', formatter: (value: any, row: any) => row.className || row.class },
    { 
      key: 'feeItems', 
      label: 'Fee Details',
      formatter: (value: any, row: any) => {
        if (row.feeItems && row.feeItems.length > 0) {
          return row.feeItems.map((item: any) => `${item.title}: BHD ${item.amount.toFixed(3)}`).join(', ');
        }
        return `${formatters.capitalize(row.feeType)}: BHD ${row.amount.toFixed(3)}`;
      }
    },
    { 
      key: 'totalAmount', 
      label: 'Total Amount', 
      formatter: (value: any, row: any) => formatters.currency(row.totalAmount || row.amount)
    },
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
          <div className="flex gap-3">
            {user?.role === 'super_admin' && branches.length > 0 && (
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                
                {/* Fee Selection Section */}
                {formData.studentId && (
                  <div className="space-y-3 border rounded-lg p-4">
                    <Label>Select Fees to Collect *</Label>
                    {loadingFees ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : availableFees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No fee structures configured for this class</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {/* Group fees by type */}
                        {Object.entries(
                          availableFees.reduce((acc, fee) => {
                            if (!acc[fee.feeType]) acc[fee.feeType] = [];
                            acc[fee.feeType].push(fee);
                            return acc;
                          }, {} as Record<string, FeeStructure[]>)
                        ).map(([feeType, fees]) => (
                          <div key={feeType} className="space-y-2">
                            <h4 className="font-medium text-sm capitalize">{feeType} Fees</h4>
                            {feeType === 'transport' ? (
                              // Special handling for transport fees
                              <div className="space-y-2 ml-4">
                                {fees.length > 0 && (
                                  <div className="flex items-start space-x-2">
                                    <Checkbox
                                      id={`fee-${fees[0]._id}`}
                                      checked={selectedFees.has(fees[0]._id)}
                                      onCheckedChange={() => handleFeeToggle(fees[0]._id)}
                                    />
                                    <div className="flex-1">
                                      <Label
                                        htmlFor={`fee-${fees[0]._id}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {fees[0].title}
                                      </Label>
                                      {selectedFees.has(fees[0]._id) && (
                                        <Select
                                          value={transportDistanceGroups[fees[0]._id] || ''}
                                          onValueChange={(value) => handleDistanceGroupChange(fees[0]._id, value)}
                                        >
                                          <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select distance range" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fees.map((fee) => {
                                              const hasDiscount = selectedStudent?.isStaffChild && fee.staffDiscountPercent && fee.staffDiscountPercent > 0;
                                              const discountedAmount = hasDiscount 
                                                ? fee.amount - (fee.amount * fee.staffDiscountPercent! / 100)
                                                : fee.amount;
                                              
                                              return (
                                                <SelectItem key={fee._id} value={fee.transportDistanceGroup!}>
                                                  {fee.distanceRange} - {hasDiscount ? (
                                                    <>
                                                      <span className="line-through">BHD {fee.amount.toFixed(3)}</span>
                                                      {' '}
                                                      <span className="text-green-600 font-semibold">BHD {discountedAmount.toFixed(3)}</span>
                                                    </>
                                                  ) : (
                                                    `BHD ${fee.amount.toFixed(3)}`
                                                  )}
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Regular fees
                              fees.map((fee) => {
                                const originalAmount = fee.amount;
                                const hasDiscount = selectedStudent?.isStaffChild && fee.staffDiscountPercent && fee.staffDiscountPercent > 0;
                                const discountedAmount = hasDiscount 
                                  ? originalAmount - (originalAmount * fee.staffDiscountPercent! / 100)
                                  : originalAmount;
                                
                                return (
                                  <div key={fee._id} className="flex items-center space-x-2 ml-4">
                                    <Checkbox
                                      id={`fee-${fee._id}`}
                                      checked={selectedFees.has(fee._id)}
                                      onCheckedChange={() => handleFeeToggle(fee._id)}
                                    />
                                    <Label
                                      htmlFor={`fee-${fee._id}`}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      {fee.title} - {hasDiscount ? (
                                        <span>
                                          <span className="line-through text-muted-foreground">BHD {originalAmount.toFixed(3)}</span>
                                          {' '}
                                          <span className="text-green-600 font-semibold">BHD {discountedAmount.toFixed(3)}</span>
                                          {' '}
                                          <span className="text-xs text-green-600">({fee.staffDiscountPercent}% staff discount)</span>
                                        </span>
                                      ) : (
                                        <span>BHD {originalAmount.toFixed(3)}</span>
                                      )}
                                    </Label>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Total Amount Display */}
                    {selectedFees.size > 0 && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Amount:</span>
                          <span className="text-lg">BHD {calculateTotal().toFixed(3)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">BHD {(stats?.totalCollection?.total || 0).toFixed(3)}</div>
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
              <div className="text-3xl font-bold">BHD {(stats?.monthlyCollection?.total || 0).toFixed(3)}</div>
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
              <div className="text-3xl font-bold">BHD {(stats?.dailyCollection?.total || 0).toFixed(3)}</div>
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
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{payment.studentName}</h3>
                        <span className="text-sm text-muted-foreground">
                          {payment.receiptNo}
                        </span>
                      </div>
                      
                      {/* Fee Items List */}
                      {payment.feeItems && payment.feeItems.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Fee Items:</div>
                          <div className="grid gap-2">
                            {payment.feeItems.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm border-l-2 border-primary/30 pl-3">
                                <div>
                                  <span className="font-medium">{item.title}</span>
                                  {item.transportDistanceGroup && (
                                    <span className="text-muted-foreground ml-2">({item.transportDistanceGroup})</span>
                                  )}
                                </div>
                                <span className="font-medium">BHD {item.amount.toFixed(3)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        // Backward compatibility for old single-fee records
                        <div className="text-sm">
                          <span className="text-muted-foreground">Fee Type:</span>
                          <span className="ml-2 font-medium capitalize">{payment.feeType}</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <span className="ml-2 font-medium">{payment.className || payment.class}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="ml-2 font-semibold text-primary">BHD {(payment.totalAmount || payment.amount).toFixed(3)}</span>
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
                      className="ml-4"
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
