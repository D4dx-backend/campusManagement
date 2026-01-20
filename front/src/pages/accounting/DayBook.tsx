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
import { useDayBook } from '@/hooks/useAccounting';
import { Download, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { exportToCSV, exportToExcel, formatters } from '@/utils/exportUtils';
import { format } from 'date-fns';

export const DayBook = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [transactionType, setTransactionType] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: response, isLoading, error } = useDayBook({
    startDate,
    endDate,
    transactionType,
    search,
    page,
    limit,
  });

  const data = response?.data;
  const transactions = data?.transactions || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const handleExportCSV = () => {
    const exportColumns = [
      { key: 'date', label: 'Date', formatter: formatters.date },
      { key: 'type', label: 'Type', formatter: formatters.capitalize },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', formatter: formatters.currency },
      { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
      { key: 'referenceNumber', label: 'Reference No.' },
    ];

    exportToCSV({
      data: transactions,
      columns: exportColumns,
      filename: `daybook_${startDate}_to_${endDate}.csv`,
    });
  };

  const handleExportExcel = () => {
    const exportColumns = [
      { key: 'date', label: 'Date', formatter: formatters.date },
      { key: 'type', label: 'Type', formatter: formatters.capitalize },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', formatter: formatters.currency },
      { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
      { key: 'referenceNumber', label: 'Reference No.' },
    ];

    exportToExcel({
      data: transactions,
      columns: exportColumns,
      filename: `daybook_${startDate}_to_${endDate}.xlsx`,
      sheetName: 'Day Book',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Day Book Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item label {
              display: block;
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .summary-item value {
              display: block;
              font-size: 18px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #333;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .income {
              color: #16a34a;
              font-weight: bold;
            }
            .expense {
              color: #dc2626;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body {
                padding: 10px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Day Book Report</h1>
            <p>Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}</p>
            <p>Transaction Type: ${transactionType === 'all' ? 'All Transactions' : transactionType === 'income' ? 'Income Only' : 'Expense Only'}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <label>Total Income</label>
              <value class="income">₹${summary?.totalIncome.toLocaleString()}</value>
            </div>
            <div class="summary-item">
              <label>Total Expense</label>
              <value class="expense">₹${summary?.totalExpense.toLocaleString()}</value>
            </div>
            <div class="summary-item">
              <label>Net Balance</label>
              <value style="color: ${(summary?.netBalance || 0) >= 0 ? '#16a34a' : '#dc2626'}">
                ₹${summary?.netBalance.toLocaleString()}
              </value>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Reference No.</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (t) => `
                <tr>
                  <td>${format(new Date(t.date), 'dd MMM yyyy')}</td>
                  <td><span class="${t.type}">${t.type.toUpperCase()}</span></td>
                  <td>${t.category}</td>
                  <td>${t.description}</td>
                  <td class="${t.type}">₹${t.amount.toLocaleString()}</td>
                  <td>${t.paymentMethod.toUpperCase()}</td>
                  <td>${t.referenceNumber}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            <p>Total Records: ${transactions.length}</p>
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
            <h1 className="text-3xl font-bold">Day Book</h1>
            <p className="text-muted-foreground">Chronological record of all transactions</p>
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
        {summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{summary.totalIncome.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{summary.totalExpense.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ₹{summary.netBalance.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
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
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                    <SelectItem value="expense">Expense Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search transactions..."
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

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Error loading transactions</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions found</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Reference No.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>{format(new Date(transaction.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge
                              variant={transaction.type === 'income' ? 'default' : 'destructive'}
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell className="max-w-md truncate">{transaction.description}</TableCell>
                          <TableCell
                            className={`font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            ₹{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                          <TableCell>{transaction.referenceNumber}</TableCell>
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
                      of {pagination.totalItems} transactions
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
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
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
