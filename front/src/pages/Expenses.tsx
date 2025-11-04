import { useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, FileText, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useCreateExpense, useDeleteExpense, useExpenseStats } from '@/hooks/useExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatters } from '@/utils/exportUtils';


const ExpensesContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Debounce search to prevent excessive API calls
  const debounceSearch = useCallback((term: string) => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(term);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Update debounced search when searchTerm changes
  useMemo(() => {
    const cleanup = debounceSearch(searchTerm);
    return cleanup;
  }, [searchTerm, debounceSearch]);

  // API hooks with debounced search - only pass basic parameters
  const { data: expensesResponse, isLoading, error } = useExpenses({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearchTerm,
  });

  const { data: statsResponse } = useExpenseStats();
  const { data: categoriesResponse } = useExpenseCategories({ status: 'active', limit: 100 });
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();



  // Early return if there's a critical error
  if (error && error.response?.status === 401) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Authentication error. Please log in again.</p>
      </div>
    );
  }



  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'bank' as 'cash' | 'bank',
    remarks: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      paymentMethod: 'bank',
      remarks: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error', 
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    console.log('Submitting expense data:', {
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      approvedBy: user?.name || 'System',
      remarks: formData.remarks,
    });
    
    try {
      await createExpenseMutation.mutateAsync({
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        approvedBy: user?.name || 'System',
        remarks: formData.remarks,
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done in the mutation hook
    }
  };

  const handleDelete = (id: string, description: string) => {
    confirm(
      {
        title: 'Delete Expense',
        description: `Are you sure you want to delete the expense "${description}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      async () => {
        try {
          await deleteExpenseMutation.mutateAsync(id);
        } catch (error) {
          // Error handling is done in the mutation hook
        }
      }
    );
  };

  // Get raw data from API
  const rawExpenses = expensesResponse?.data || [];
  
  // Apply frontend filters
  const expenses = rawExpenses.filter((expense: any) => {
    // Apply category filter
    if (filterValues.category && expense.category !== filterValues.category) {
      return false;
    }
    
    // Apply payment method filter
    if (filterValues.paymentMethod && expense.paymentMethod !== filterValues.paymentMethod) {
      return false;
    }
    
    // Apply date range filter
    if (filterValues.date_from) {
      const expenseDate = new Date(expense.date);
      const fromDate = new Date(filterValues.date_from);
      if (expenseDate < fromDate) return false;
    }
    
    if (filterValues.date_to) {
      const expenseDate = new Date(expense.date);
      const toDate = new Date(filterValues.date_to);
      if (expenseDate > toDate) return false;
    }
    
    // Apply amount filter (minimum amount)
    if (filterValues.amount && expense.amount < parseFloat(filterValues.amount)) {
      return false;
    }
    
    return true;
  });
  const categories = categoriesResponse?.data || [];
  const stats = statsResponse?.data || statsResponse || { 
    totalExpenses: { total: 0, count: 0 }, 
    monthlyExpenses: { total: 0, count: 0 },
    yearlyExpenses: { total: 0, count: 0 }
  };
  const pagination = expensesResponse?.pagination;

  // Filter configuration
  const filterOptions = [
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categories.length > 0 
        ? categories.map((category: any) => ({ value: category.name, label: category.name }))
        : [
            { value: 'salary', label: 'Salary' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'utilities', label: 'Utilities' },
            { value: 'supplies', label: 'Supplies' },
            { value: 'transport', label: 'Transport' },
            { value: 'other', label: 'Other' }
          ]
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'select' as const,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank Transfer' }
      ]
    },
    {
      key: 'date',
      label: 'Date Range',
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
    { key: 'voucherNo', label: 'Voucher No' },
    { key: 'date', label: 'Date', formatter: formatters.date },
    { key: 'category', label: 'Category', formatter: formatters.capitalize },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', formatter: formatters.currency },
    { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
    { key: 'approvedBy', label: 'Approved By' },
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

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Expense Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage institutional expenses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
                <DialogDescription>
                  Enter the expense details to record a new expense transaction.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category._id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="salary">Salary</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="supplies">Supplies</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
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
                  <Button type="submit" disabled={createExpenseMutation.isPending}>
                    {createExpenseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Record Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats.totalExpenses?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats.totalExpenses?.count || 0} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(stats.monthlyExpenses?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats.monthlyExpenses?.count || 0} expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Average Expense</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{stats.totalExpenses?.count > 0 ? Math.round((stats.totalExpenses?.total || 0) / stats.totalExpenses?.count).toLocaleString() : '0'}</div>
              <p className="text-xs text-muted-foreground mt-2">per transaction</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          searchPlaceholder="Search by description, voucher no, or category..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'expenses',
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
          data={expenses}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No expenses recorded"
          }}
        >
          <div className="grid gap-4">
            {expenses?.map(expense => (
              <Card key={expense._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{expense.description}</h3>
                        <span className="text-sm text-muted-foreground">
                          {expense.voucherNo}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-2 font-medium capitalize">{expense.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 font-medium text-destructive">₹{(expense.amount || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <span className="ml-2 font-medium capitalize">{expense.paymentMethod || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <span className="ml-2 font-medium">{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Approved by:</span>
                          <span className="ml-2 font-medium">{expense.approvedBy || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(expense._id, expense.description)}
                      disabled={deleteExpenseMutation.isPending}
                    >
                      {deleteExpenseMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>
      <ConfirmationComponent />
    </div>
  );
};

const Expenses = () => {
  return (
    <ErrorBoundary>
      <AppLayout>
        <ExpensesContent />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Expenses;
