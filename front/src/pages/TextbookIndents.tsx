import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Edit, 
  Trash2, 
  Loader2, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  useTextbookIndents, 
  useTextbookIndentStats,
  useIssueTextbookIndent,
  useCancelTextbookIndent,
  useGenerateTextbookReceipt
} from '@/hooks/useTextbookIndents';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { TextbookIndent } from '@/types/textbookIndent';
import { CreateTextbookIndent } from '@/components/textbook/CreateTextbookIndent';
import { ReturnTextbooks } from '@/components/textbook/ReturnTextbooks';
import { TextbookReceiptDialog } from '@/components/textbook/TextbookReceiptDialog';
import { formatters } from '@/utils/exportUtils';
import { createApiFilters, filterMappings, createExportDataFetcher } from '@/utils/apiFilters';

const TextbookIndents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<TextbookIndent | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
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
    filterMappings.textbookIndents
  );

  const { data: indentsResponse, isLoading, error } = useTextbookIndents(apiFilters);

  const { data: studentsResponse } = useStudents({ limit: 100 });
  const { data: classesResponse } = useClasses({ status: 'active', limit: 100 });
  const { data: statsResponse } = useTextbookIndentStats();
  const issueIndentMutation = useIssueTextbookIndent();
  const cancelIndentMutation = useCancelTextbookIndent();
  const generateReceiptMutation = useGenerateTextbookReceipt();

  // Get data from API
  const indents = indentsResponse?.data || [];
  const pagination = indentsResponse?.pagination;
  const stats = statsResponse?.data || {
    totalIndents: 0,
    pendingIndents: 0,
    issuedIndents: 0,
    overdueIndents: 0
  };
  const students = studentsResponse?.data || [];
  const classes = classesResponse?.data || [];

  // Filter configuration
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'issued', label: 'Issued' },
        { value: 'partially_returned', label: 'Partially Returned' },
        { value: 'returned', label: 'Returned' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'partial', label: 'Partial' },
        { value: 'paid', label: 'Paid' }
      ]
    },
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
      key: 'issueDate',
      label: 'Issue Date',
      type: 'dateRange' as const
    },
    {
      key: 'expectedReturnDate',
      label: 'Expected Return Date',
      type: 'dateRange' as const
    }
  ];

  // Export columns configuration
  const exportColumns = [
    { key: 'indentNo', label: 'Indent No' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'admissionNo', label: 'Admission No' },
    { key: 'class', label: 'Class' },
    { key: 'status', label: 'Status', formatter: formatters.capitalize },
    { key: 'paymentStatus', label: 'Payment Status', formatter: formatters.capitalize },
    { key: 'totalAmount', label: 'Total Amount', formatter: formatters.currency },
    { key: 'paidAmount', label: 'Paid Amount', formatter: formatters.currency },
    { key: 'balanceAmount', label: 'Balance Amount', formatter: formatters.currency },
    { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
    { key: 'issueDate', label: 'Issue Date', formatter: formatters.date },
    { key: 'expectedReturnDate', label: 'Expected Return Date', formatter: formatters.date },
    { key: 'issuedByName', label: 'Issued By' },
    { key: 'academicYear', label: 'Academic Year' }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      issued: { variant: 'default' as const, icon: CheckCircle, label: 'Issued' },
      partially_returned: { variant: 'outline' as const, icon: AlertTriangle, label: 'Partial Return' },
      returned: { variant: 'secondary' as const, icon: CheckCircle, label: 'Returned' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'destructive' as const, label: 'Pending' },
      partial: { variant: 'outline' as const, label: 'Partial' },
      paid: { variant: 'secondary' as const, label: 'Paid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewIndent = (indent: TextbookIndent) => {
    setSelectedIndent(indent);
    setIsViewDialogOpen(true);
  };

  const handleReturnBooks = (indent: TextbookIndent) => {
    setSelectedIndent(indent);
    setIsReturnDialogOpen(true);
  };

  const handleIssueIndent = (id: string, indentNo: string) => {
    confirm(
      {
        title: 'Issue Textbooks',
        description: `Are you sure you want to issue textbooks for indent ${indentNo}? This will update the inventory.`,
        confirmText: 'Issue',
      },
      async () => {
        try {
          await issueIndentMutation.mutateAsync(id);
        } catch (error) {
          // Error handling is done in the mutation hook
        }
      }
    );
  };

  const handleCancelIndent = (id: string, indentNo: string) => {
    confirm(
      {
        title: 'Cancel Indent',
        description: `Are you sure you want to cancel indent ${indentNo}? This action cannot be undone.`,
        confirmText: 'Cancel Indent',
        variant: 'destructive'
      },
      async () => {
        try {
          await cancelIndentMutation.mutateAsync({ id, reason: 'Cancelled by user' });
        } catch (error) {
          // Error handling is done in the mutation hook
        }
      }
    );
  };

  const handleGenerateReceipt = async (id: string) => {
    try {
      const response = await generateReceiptMutation.mutateAsync(id);
      if (response.success && response.data) {
        setReceiptData(response.data);
        setIsReceiptDialogOpen(true);
      }
    } catch (error) {
      // Error handling is done in the mutation hook
    }
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Textbook Indents</h1>
            <p className="text-muted-foreground mt-1">Manage textbook issuance and returns</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Indent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Textbook Indent</DialogTitle>
              </DialogHeader>
              <CreateTextbookIndent 
                onSuccess={() => setIsCreateDialogOpen(false)}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Indents</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalIndents}</div>
                <p className="text-xs text-muted-foreground mt-2">all time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.pendingIndents}</div>
                <p className="text-xs text-muted-foreground mt-2">awaiting issue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium text-muted-foreground">Issued</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.issuedIndents}</div>
                <p className="text-xs text-muted-foreground mt-2">currently issued</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.overdueIndents}</div>
                <p className="text-xs text-muted-foreground mt-2">need attention</p>
              </CardContent>
            </Card>
          </div>
        )}

        <DataTable
          searchPlaceholder="Search by indent no, student name, or admission no..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterOptions}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'textbook-indents',
            columns: exportColumns,
            fetchAllData: createExportDataFetcher(
              useTextbookIndents,
              searchTerm,
              filterValues,
              filterMappings.textbookIndents,
              indents
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
          data={indents}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No textbook indents found"
          }}
        >
          <div className="grid gap-4">
            {indents.map((indent: TextbookIndent) => (
              <Card key={indent._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{indent.indentNo}</h3>
                        {getStatusBadge(indent.status)}
                        {getPaymentStatusBadge(indent.paymentStatus)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Student:</span>
                          <div className="font-medium">{indent.studentName}</div>
                          <div className="text-xs text-muted-foreground">{indent.admissionNo}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <div className="font-medium">{indent.class}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Amount:</span>
                          <div className="font-medium">₹{indent.totalAmount.toLocaleString()}</div>
                          {indent.balanceAmount > 0 && (
                            <div className="text-xs text-red-600">Balance: ₹{indent.balanceAmount.toLocaleString()}</div>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Issue Date:</span>
                          <div className="font-medium">{new Date(indent.issueDate).toLocaleDateString()}</div>
                          {indent.expectedReturnDate && (
                            <div className="text-xs text-muted-foreground">
                              Return: {new Date(indent.expectedReturnDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">Items: </span>
                        <span className="font-medium">{indent.items.length} book(s)</span>
                        <span className="text-muted-foreground ml-4">Issued by: </span>
                        <span className="font-medium">{indent.issuedByName}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleViewIndent(indent)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {indent.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleIssueIndent(indent._id, indent.indentNo)}
                          disabled={issueIndentMutation.isPending}
                        >
                          {issueIndentMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {(indent.status === 'issued' || indent.status === 'partially_returned') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReturnBooks(indent)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}

                      {(indent.status === 'issued' || indent.status === 'partially_returned' || indent.status === 'returned') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleGenerateReceipt(indent._id)}
                          disabled={generateReceiptMutation.isPending}
                          title="Generate Receipt"
                        >
                          {generateReceiptMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {indent.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCancelIndent(indent._id, indent.indentNo)}
                          disabled={cancelIndentMutation.isPending}
                        >
                          {cancelIndentMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>

        {/* View Indent Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Textbook Indent Details</DialogTitle>
            </DialogHeader>
            {selectedIndent && (
              <div className="space-y-6">
                {/* Indent Info */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold mb-3">Indent Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Indent No:</span> <strong>{selectedIndent.indentNo}</strong></div>
                      <div><span className="text-gray-600">Status:</span> {getStatusBadge(selectedIndent.status)}</div>
                      <div><span className="text-gray-600">Payment Status:</span> {getPaymentStatusBadge(selectedIndent.paymentStatus)}</div>
                      <div><span className="text-gray-600">Issue Date:</span> <strong>{new Date(selectedIndent.issueDate).toLocaleDateString()}</strong></div>
                      {selectedIndent.expectedReturnDate && (
                        <div><span className="text-gray-600">Expected Return:</span> <strong>{new Date(selectedIndent.expectedReturnDate).toLocaleDateString()}</strong></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Student Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">Name:</span> <strong>{selectedIndent.studentName}</strong></div>
                      <div><span className="text-gray-600">Admission No:</span> <strong>{selectedIndent.admissionNo}</strong></div>
                      <div><span className="text-gray-600">Class:</span> <strong>{selectedIndent.class}</strong></div>
                      <div><span className="text-gray-600">Academic Year:</span> <strong>{selectedIndent.academicYear}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-600">Total Amount:</span> <strong>₹{selectedIndent.totalAmount.toLocaleString()}</strong></div>
                    <div><span className="text-gray-600">Paid Amount:</span> <strong className="text-green-600">₹{selectedIndent.paidAmount.toLocaleString()}</strong></div>
                    <div><span className="text-gray-600">Balance:</span> <strong className={selectedIndent.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>₹{selectedIndent.balanceAmount.toLocaleString()}</strong></div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Payment Method:</span> <strong className="capitalize">{selectedIndent.paymentMethod}</strong>
                  </div>
                </div>

                {/* Textbook Items */}
                <div>
                  <h3 className="font-semibold mb-3">Textbook Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Book Code</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Title</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Subject</th>
                          <th className="px-4 py-2 text-center text-sm font-medium">Qty</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Price</th>
                          <th className="px-4 py-2 text-center text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIndent.items.map((item, index) => (
                          <tr key={item._id} className={index > 0 ? 'border-t border-gray-200' : ''}>
                            <td className="px-4 py-2 text-sm">{item.bookCode}</td>
                            <td className="px-4 py-2 text-sm">{item.title}</td>
                            <td className="px-4 py-2 text-sm">{item.subject}</td>
                            <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">₹{item.price.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant={item.status === 'issued' ? 'default' : 'secondary'} className="text-xs">
                                {item.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedIndent.remarks && (
                  <div>
                    <h3 className="font-semibold mb-2">Remarks</h3>
                    <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded">{selectedIndent.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Return Textbooks Dialog */}
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Return Textbooks</DialogTitle>
            </DialogHeader>
            {selectedIndent && (
              <ReturnTextbooks 
                indent={selectedIndent}
                onSuccess={() => setIsReturnDialogOpen(false)}
                onCancel={() => setIsReturnDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <TextbookReceiptDialog
          open={isReceiptDialogOpen}
          onOpenChange={setIsReceiptDialogOpen}
          receiptData={receiptData}
        />
      </div>
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default TextbookIndents;