import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText, Loader2, AlertCircle, Bus, ArrowRight } from 'lucide-react';
import { useDashboardReport, useFinancialReport } from '@/hooks/useReports';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Get dashboard overview data
  const { data: dashboardResponse, isLoading: dashboardLoading } = useDashboardReport();
  
  // Get financial report for the selected month
  const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1).toISOString();
  const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0).toISOString();
  
  const { data: financialResponse, isLoading: financialLoading } = useFinancialReport({
    startDate,
    endDate,
    includeBreakdown: true
  });

  const isLoading = dashboardLoading || financialLoading;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Extract data from API responses
  const dashboardData = dashboardResponse?.data;
  const financialData = financialResponse?.data;
  
  // Calculate values for display
  const monthlyIncome = financialData?.summary.totalIncome || 0;
  const monthlyExpenses = financialData?.summary.totalExpenses || 0;
  const netIncome = financialData?.summary.netProfit || 0;
  
  const totalIncome = dashboardData?.fees.totalCollection || 0;
  const totalExpenses = dashboardData?.expenses.totalExpenses || 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Financial reports and institutional statistics</p>
        </div>

        <div className="flex gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={month} value={idx.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Monthly Report - {months[parseInt(selectedMonth)]} {selectedYear}</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">₹{monthlyIncome.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">₹{monthlyExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Operations: ₹{(financialData?.expenses.generalExpenses.totalAmount || 0).toLocaleString()}<br />
                  Payroll: ₹{(financialData?.expenses.payrollExpenses.totalAmount || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Net Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${netIncome >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ₹{netIncome.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {netIncome >= 0 ? 'Profit' : 'Loss'} for the month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(financialData?.income.feeCollection.totalTransactions || 0) + 
                   (financialData?.expenses.generalExpenses.totalTransactions || 0) + 
                   (financialData?.expenses.payrollExpenses.totalTransactions || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">total this month</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income Breakdown (Monthly)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData?.income.breakdown?.map((item) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <span className="capitalize font-medium">{item._id} Fee</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${monthlyIncome > 0 ? (item.totalAmount / monthlyIncome) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-secondary w-24 text-right">₹{item.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">
                    No income data for selected month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown (Monthly)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="capitalize font-medium">Staff Salaries</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${monthlyExpenses > 0 ? ((financialData?.expenses.payrollExpenses.totalAmount || 0) / monthlyExpenses) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-bold text-orange-600 w-24 text-right">
                      ₹{(financialData?.expenses.payrollExpenses.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                {financialData?.expenses.breakdown?.map((item) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <span className="capitalize font-medium">{item._id}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${monthlyExpenses > 0 ? (item.totalAmount / monthlyExpenses) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-orange-600 w-24 text-right">₹{item.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">
                    No expense data for selected month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
{/* Quick Access to Specialized Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Specialized Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports/fee-dues')}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-lg">Fee Dues Report</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        View pending and overdue fee payments with aging analysis
                      </p>
                      <Button variant="outline" size="sm">
                        View Report
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/reports/transport')}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bus className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">Transport Report</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Student transport statistics and route-wise breakdown
                      </p>
                      <Button variant="outline" size="sm">
                        View Report
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        
        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground mb-2">Total Students</p>
                <div className="text-3xl font-bold text-primary">{dashboardData?.students.total || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dashboardData?.students.active || 0} active, {dashboardData?.students.inactive || 0} inactive
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Total Staff</p>
                <div className="text-3xl font-bold text-secondary">{dashboardData?.staff.total || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dashboardData?.staff.active || 0} active members
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Total Collection</p>
                <div className="text-3xl font-bold">₹{(dashboardData?.fees.totalCollection || 0).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  All time fee collection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
