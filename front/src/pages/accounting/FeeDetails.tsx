import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFeeDetails } from '@/hooks/useAccounting';
import { Download, Printer, DollarSign, Users, CreditCard } from 'lucide-react';
import { exportToCSV, exportToExcel, formatters } from '@/utils/exportUtils';
import { format } from 'date-fns';

export const FeeDetails = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: response, isLoading, error } = useFeeDetails({
    startDate,
    endDate,
    search,
    page,
    limit,
  });

  const data = response?.data;
  const feePayments = data?.feePayments || [];
  const pagination = data?.pagination;
  const breakdown = data?.breakdown;
  const paymentMethodBreakdown = data?.paymentMethodBreakdown || [];

  const handleExportCSV = () => {
    const exportColumns = [
      { key: 'receiptNumber', label: 'Receipt No.' },
      { key: 'studentId.name', label: 'Student Name' },
      { key: 'studentId.rollNumber', label: 'Roll Number' },
      { key: 'classId.name', label: 'Class' },
      { key: 'paymentDate', label: 'Payment Date', formatter: formatters.date },
      { key: 'tuitionFee', label: 'Tuition Fee', formatter: formatters.currency },
      { key: 'transportFee', label: 'Transport Fee', formatter: formatters.currency },
      { key: 'totalAmount', label: 'Total Amount', formatter: formatters.currency },
      { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
      { key: 'status', label: 'Status', formatter: formatters.capitalize },
    ];

    exportToCSV({
      data: feePayments.map((payment: any) => ({
        ...payment,
        'studentId.name': payment.studentId?.name,
        'studentId.rollNumber': payment.studentId?.rollNumber,
        'classId.name': payment.classId?.name,
      })),
      columns: exportColumns,
      filename: `fee_details_${startDate}_to_${endDate}.csv`,
    });
  };

  const handleExportExcel = () => {
    const exportColumns = [
      { key: 'receiptNumber', label: 'Receipt No.' },
      { key: 'studentId.name', label: 'Student Name' },
      { key: 'studentId.rollNumber', label: 'Roll Number' },
      { key: 'classId.name', label: 'Class' },
      { key: 'paymentDate', label: 'Payment Date', formatter: formatters.date },
      { key: 'tuitionFee', label: 'Tuition Fee', formatter: formatters.currency },
      { key: 'transportFee', label: 'Transport Fee', formatter: formatters.currency },
      { key: 'cocurricularFee', label: 'Co-curricular Fee', formatter: formatters.currency },
      { key: 'maintenanceFee', label: 'Maintenance Fee', formatter: formatters.currency },
      { key: 'examFee', label: 'Exam Fee', formatter: formatters.currency },
      { key: 'textbookFee', label: 'Textbook Fee', formatter: formatters.currency },
      { key: 'totalAmount', label: 'Total Amount', formatter: formatters.currency },
      { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
      { key: 'status', label: 'Status', formatter: formatters.capitalize },
    ];

    exportToExcel({
      data: feePayments.map((payment: any) => ({
        ...payment,
        'studentId.name': payment.studentId?.name,
        'studentId.rollNumber': payment.studentId?.rollNumber,
        'classId.name': payment.classId?.name,
      })),
      columns: exportColumns,
      filename: `fee_details_${startDate}_to_${endDate}.xlsx`,
      sheetName: 'Fee Details',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Details Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .summary-card label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; }
            .summary-card value { display: block; font-size: 18px; font-weight: bold; color: #16a34a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #333; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fee Details Report</h1>
            <p>Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}</p>
          </div>

          ${
            breakdown
              ? `
          <div class="summary">
            <div class="summary-card">
              <label>Total Collected</label>
              <value>₹${breakdown.totalPaid?.toLocaleString()}</value>
            </div>
            <div class="summary-card">
              <label>Paid Payments</label>
              <value>${breakdown.paidCount}</value>
            </div>
            <div class="summary-card">
              <label>Pending Payments</label>
              <value>${breakdown.pendingCount}</value>
            </div>
          </div>
          `
              : ''
          }

          <table>
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Student</th>
                <th>Class</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${feePayments
                .map(
                  (payment: any) => `
                <tr>
                  <td>${payment.receiptNumber}</td>
                  <td>${payment.studentId?.name || 'N/A'}</td>
                  <td>${payment.classId?.name || 'N/A'}</td>
                  <td>${format(new Date(payment.paymentDate), 'dd MMM yyyy')}</td>
                  <td>₹${payment.totalAmount.toLocaleString()}</td>
                  <td>${payment.paymentMethod.toUpperCase()}</td>
                  <td>${payment.status.toUpperCase()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            <p>Total Records: ${feePayments.length}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
              Print Report
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Details</h1>
            <p className="text-muted-foreground">Comprehensive fee payment analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {breakdown && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{breakdown.totalPaid?.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Payments</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breakdown.paidCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{breakdown.pendingCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{breakdown.partialCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fee Type Breakdown */}
        {breakdown && (
          <Card>
            <CardHeader>
              <CardTitle>Fee Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Tuition Fee</div>
                  <div className="text-lg font-semibold">₹{breakdown.totalTuitionFee?.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Transport Fee</div>
                  <div className="text-lg font-semibold">₹{breakdown.totalTransportFee?.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Co-curricular</div>
                  <div className="text-lg font-semibold">₹{breakdown.totalCocurricularFee?.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Maintenance</div>
                  <div className="text-lg font-semibold">₹{breakdown.totalMaintenanceFee?.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Exam Fee</div>
                  <div className="text-lg font-semibold">₹{breakdown.totalExamFee?.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Textbook Fee</div>
                  <div className="text-lg font-semibold">₹{breakdown.totalTextbookFee?.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Breakdown */}
        {paymentMethodBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {paymentMethodBreakdown.map((method: any) => (
                  <div key={method._id} className="space-y-1">
                    <div className="text-sm text-muted-foreground capitalize">{method._id}</div>
                    <div className="text-lg font-semibold">₹{method.totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{method.count} payments</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Receipt or student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Items per page</Label>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Error loading fee details</div>
            ) : feePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No fee payments found</div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Tuition</TableHead>
                        <TableHead>Transport</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feePayments.map((payment: any) => (
                        <TableRow key={payment._id}>
                          <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>{payment.studentId?.name || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">
                                {payment.studentId?.rollNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{payment.classId?.name || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</TableCell>
                          <TableCell>₹{payment.tuitionFee.toLocaleString()}</TableCell>
                          <TableCell>₹{payment.transportFee.toLocaleString()}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₹{payment.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === 'paid'
                                  ? 'default'
                                  : payment.status === 'pending'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}{' '}
                      of {pagination.totalItems} payments
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
