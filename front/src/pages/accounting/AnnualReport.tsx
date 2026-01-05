import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { useAnnualReport } from '@/hooks/useAccounting';
import { Download, Printer, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { exportToCSV, exportToExcel, formatters } from '@/utils/exportUtils';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart as RechartPieChart,
  Pie,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export const AnnualReport = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: response, isLoading, error } = useAnnualReport({ year });

  const data = response?.data;
  const monthlySummary = data?.monthlySummary || [];
  const expenseByCategory = data?.expenseByCategory || [];
  const summary = data?.summary;

  const handleExportCSV = () => {
    if (!monthlySummary.length) return;

    exportToCSV({
      data: monthlySummary,
      columns: [
        { key: 'month', label: 'Month' },
        { key: 'income', label: 'Income', formatter: formatters.currency },
        { key: 'expenses', label: 'Expenses', formatter: formatters.currency },
        { key: 'netProfit', label: 'Net Profit', formatter: formatters.currency },
      ],
      filename: `annual_report_${year}.csv`,
    });
  };

  const handleExportExcel = () => {
    if (!monthlySummary.length) return;

    exportToExcel({
      data: monthlySummary,
      columns: [
        { key: 'month', label: 'Month' },
        { key: 'income', label: 'Income', formatter: formatters.currency },
        { key: 'expenses', label: 'Expenses', formatter: formatters.currency },
        { key: 'netProfit', label: 'Net Profit', formatter: formatters.currency },
      ],
      filename: `annual_report_${year}.xlsx`,
      sheetName: 'Annual Report',
    });
  };

  const handlePrint = () => {
    if (!data) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Annual Finance Report ${data.fiscalYear}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; }
            .summary-card label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; }
            .summary-card value { display: block; font-size: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #333; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .income { color: #16a34a; font-weight: bold; }
            .expense { color: #dc2626; font-weight: bold; }
            .profit { color: #2563eb; font-weight: bold; }
            .section { margin-top: 30px; }
            .section h2 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 2px solid #666; padding-bottom: 5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Annual Finance Report</h1>
            <p>Fiscal Year: ${data.fiscalYear}</p>
            <p>Period: ${format(new Date(data.startDate), 'dd MMM yyyy')} to ${format(new Date(data.endDate), 'dd MMM yyyy')}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <label>Total Income</label>
              <value class="income">₹${summary?.totalIncome.toLocaleString()}</value>
            </div>
            <div class="summary-card">
              <label>Total Expenses</label>
              <value class="expense">₹${summary?.totalExpenses.toLocaleString()}</value>
            </div>
            <div class="summary-card">
              <label>Net Profit</label>
              <value class="profit">₹${summary?.netProfit.toLocaleString()}</value>
            </div>
          </div>

          <div class="section">
            <h2>Monthly Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                ${monthlySummary
                  .map(
                    (month) => `
                  <tr>
                    <td>${month.month}</td>
                    <td class="income">₹${month.income.toLocaleString()}</td>
                    <td class="expense">₹${month.expenses.toLocaleString()}</td>
                    <td class="profit">₹${month.netProfit.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Expense by Category</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Amount</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                ${expenseByCategory
                  .map(
                    (cat) => `
                  <tr>
                    <td>${cat.categoryName || 'Uncategorized'}</td>
                    <td class="expense">₹${cat.totalAmount.toLocaleString()}</td>
                    <td>${cat.transactionCount}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            <p>Profit Margin: ${summary?.profitMargin}%</p>
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

  // Generate year options (last 5 years + current + next)
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Annual Finance Report</h1>
            <p className="text-muted-foreground">Yearly financial performance analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!data}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!data}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!data}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Year Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Fiscal Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Fiscal Year (April to March)</Label>
                <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}-{y + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error loading annual report</div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid gap-4 md:grid-cols-4">
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
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ₹{summary.totalExpenses.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      ₹{summary.netProfit.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                    <PieChart className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.profitMargin}%</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlySummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#16a34a" name="Income" />
                    <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Net Profit Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Net Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlySummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="netProfit"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Net Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Expense by Category Pie Chart */}
              {expenseByCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Distribution by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartPieChart>
                        <Pie
                          data={expenseByCategory}
                          dataKey="totalAmount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => entry.categoryName}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      </RechartPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Expense Category Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseByCategory.map((category, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {category.categoryName || 'Uncategorized'}
                            </TableCell>
                            <TableCell className="font-semibold text-red-600">
                              ₹{category.totalAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>{category.transactionCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Income</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Net Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummary.map((month, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₹{month.income.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-red-600">
                            ₹{month.expenses.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`font-semibold ${
                              month.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}
                          >
                            ₹{month.netProfit.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
};
