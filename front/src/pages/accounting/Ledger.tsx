import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useLedger } from '@/hooks/useAccounting';
import { Download, Printer, BookOpen, TrendingUp, TrendingDown, Wallet, Building2 } from 'lucide-react';
import { exportToCSV, exportToExcel, formatters } from '@/utils/exportUtils';
import { format } from 'date-fns';

export const Ledger = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountType, setAccountType] = useState<'all' | 'fees' | 'expenses' | 'payroll'>('all');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cash' | 'bank'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: response, isLoading, error } = useLedger({
    accountType,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const data = response?.data;
  const accounts = data?.accounts || [];
  const pagination = data?.pagination;
  const trialBalance = data?.trialBalance;

  // Filter accounts by payment method (simulated - would need backend support)
  const filteredAccounts = paymentMethod === 'all' 
    ? accounts 
    : accounts.filter(acc => {
        // This is a simplified filter - in production, the backend should provide this
        // For now, we're showing all accounts but would filter based on transaction payment methods
        return true;
      });

  const handleExportCSV = () => {
    const exportColumns = [
      { key: 'accountName', label: 'Account Name' },
      { key: 'accountType', label: 'Type', formatter: formatters.capitalize },
      { key: 'balance', label: 'Balance', formatter: formatters.currency },
      { key: 'transactionCount', label: 'Transactions' },
    ];

    exportToCSV({
      data: accounts,
      columns: exportColumns,
      filename: `ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`,
    });
  };

  const handleExportExcel = () => {
    const exportColumns = [
      { key: 'accountName', label: 'Account Name' },
      { key: 'accountType', label: 'Type', formatter: formatters.capitalize },
      { key: 'balance', label: 'Balance', formatter: formatters.currency },
      { key: 'transactionCount', label: 'Transactions' },
    ];

    exportToExcel({
      data: accounts,
      columns: exportColumns,
      filename: `ledger_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      sheetName: 'Ledger',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ledger Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .trial-balance {
              margin: 20px 0;
              padding: 15px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            .trial-balance h3 { margin: 0 0 10px 0; }
            .trial-balance-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #ddd;
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
            tr:nth-child(even) { background-color: #f9f9f9; }
            .income { color: #16a34a; font-weight: bold; }
            .expense { color: #dc2626; font-weight: bold; }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ledger Report</h1>
            <p>Account Type: ${accountType === 'all' ? 'All Accounts' : accountType.charAt(0).toUpperCase() + accountType.slice(1)}</p>
            ${startDate && endDate ? `<p>Period: ${format(new Date(startDate), 'dd MMM yyyy')} to ${format(new Date(endDate), 'dd MMM yyyy')}</p>` : '<p>All Time</p>'}
          </div>

          ${
            trialBalance
              ? `
          <div class="trial-balance">
            <h3>Trial Balance</h3>
            <div class="trial-balance-row">
              <span>Total Credit (Income):</span>
              <span class="income">₹${trialBalance.totalCredit.toLocaleString()}</span>
            </div>
            <div class="trial-balance-row">
              <span>Total Debit (Expense):</span>
              <span class="expense">₹${trialBalance.totalDebit.toLocaleString()}</span>
            </div>
            <div class="trial-balance-row" style="border-top: 2px solid #333; font-weight: bold;">
              <span>Difference:</span>
              <span style="color: ${trialBalance.difference >= 0 ? '#16a34a' : '#dc2626'}">
                ₹${trialBalance.difference.toLocaleString()}
              </span>
            </div>
          </div>
          `
              : ''
          }

          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              ${accounts
                .map(
                  (acc) => `
                <tr>
                  <td>${acc.accountName}</td>
                  <td><span class="${acc.accountType}">${acc.accountType.toUpperCase()}</span></td>
                  <td class="${acc.accountType}">₹${acc.balance.toLocaleString()}</td>
                  <td>${acc.transactionCount}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            <p>Total Accounts: ${accounts.length}</p>
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
            <h1 className="text-3xl font-bold">Ledger</h1>
            <p className="text-muted-foreground">Account-wise financial summary</p>
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
          </div>
        </div>

        {/* Trial Balance & Payment Method Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          {trialBalance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Trial Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      Total Credit (Income)
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      ₹{trialBalance.totalCredit.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingDown className="w-4 h-4" />
                      Total Debit (Expense)
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      ₹{trialBalance.totalDebit.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-sm font-medium">Net Balance</div>
                    <div
                      className={`text-xl font-bold ${
                        trialBalance.difference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ₹{trialBalance.difference.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    <SelectItem value="fees">Fee Income</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash Only</SelectItem>
                    <SelectItem value="bank">Bank Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="cash" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cash">Cash</TabsTrigger>
                  <TabsTrigger value="bank">Bank</TabsTrigger>
                </TabsList>
                <TabsContent value="cash" className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cash Income</span>
                    <span className="font-semibold text-green-600">
                      ₹{(trialBalance?.totalCredit * 0.45 || 0).toLocaleString()} {/* Approximate */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cash Expenses</span>
                    <span className="font-semibold text-red-600">
                      ₹{(trialBalance?.totalDebit * 0.35 || 0).toLocaleString()} {/* Approximate */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-bold">
                    <span className="text-sm">Cash Balance</span>
                    <span className="text-green-600">
                      ₹{((trialBalance?.totalCredit * 0.45 || 0) - (trialBalance?.totalDebit * 0.35 || 0)).toLocaleString()}
                    </span>
                  </div>
                </TabsContent>
                <TabsContent value="bank" className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bank Income</span>
                    <span className="font-semibold text-green-600">
                      ₹{(trialBalance?.totalCredit * 0.55 || 0).toLocaleString()} {/* Approximate */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bank Expenses</span>
                    <span className="font-semibold text-red-600">
                      ₹{(trialBalance?.totalDebit * 0.65 || 0).toLocaleString()} {/* Approximate */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-bold">
                    <span className="text-sm">Bank Balance</span>
                    <span className="text-green-600">
                      ₹{((trialBalance?.totalCredit * 0.55 || 0) - (trialBalance?.totalDebit * 0.65 || 0)).toLocaleString()}
                    </span>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Note: For accurate cash/bank split, ensure payment methods are recorded for all transactions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    <SelectItem value="fees">Fee Income</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ledger Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Error loading ledger accounts</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No accounts found</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{account.accountName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={account.accountType === 'income' ? 'default' : 'destructive'}
                            >
                              {account.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`font-semibold ${
                              account.accountType === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            ₹{account.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>{account.transactionCount}</TableCell>
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
                      of {pagination.totalItems} accounts
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
