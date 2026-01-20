import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBalanceSheet } from '@/hooks/useAccounting';
import { Download, Printer, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';
import { format } from 'date-fns';

export const BalanceSheet = () => {
  const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: response, isLoading, error } = useBalanceSheet({
    asOfDate: asOfDate || undefined,
  });

  const data = response?.data;

  const handleExportCSV = () => {
    if (!data) return;

    const exportData = [
      { category: 'Assets', item: 'Cash and Bank', amount: data.assets.cashAndBank },
      { category: 'Assets', item: 'Accounts Receivable', amount: data.assets.accountsReceivable },
      { category: 'Assets', item: 'Total Assets', amount: data.assets.totalAssets },
      { category: '', item: '', amount: '' },
      { category: 'Liabilities', item: 'Accounts Payable', amount: data.liabilities.accountsPayable },
      { category: 'Liabilities', item: 'Total Liabilities', amount: data.liabilities.totalLiabilities },
      { category: '', item: '', amount: '' },
      { category: 'Equity', item: 'Retained Earnings', amount: data.equity.retainedEarnings },
      { category: 'Equity', item: 'Total Equity', amount: data.equity.totalEquity },
    ];

    exportToCSV({
      data: exportData,
      columns: [
        { key: 'category', label: 'Category' },
        { key: 'item', label: 'Item' },
        { key: 'amount', label: 'Amount (₹)' },
      ],
      filename: `balance_sheet_${asOfDate}.csv`,
    });
  };

  const handleExportExcel = () => {
    if (!data) return;

    const exportData = [
      { category: 'Assets', item: 'Cash and Bank', amount: data.assets.cashAndBank },
      { category: 'Assets', item: 'Accounts Receivable', amount: data.assets.accountsReceivable },
      { category: 'Assets', item: 'Total Assets', amount: data.assets.totalAssets },
      { category: '', item: '', amount: '' },
      { category: 'Liabilities', item: 'Accounts Payable', amount: data.liabilities.accountsPayable },
      { category: 'Liabilities', item: 'Total Liabilities', amount: data.liabilities.totalLiabilities },
      { category: '', item: '', amount: '' },
      { category: 'Equity', item: 'Retained Earnings', amount: data.equity.retainedEarnings },
      { category: 'Equity', item: 'Total Equity', amount: data.equity.totalEquity },
    ];

    exportToExcel({
      data: exportData,
      columns: [
        { key: 'category', label: 'Category' },
        { key: 'item', label: 'Item' },
        { key: 'amount', label: 'Amount (₹)' },
      ],
      filename: `balance_sheet_${asOfDate}.xlsx`,
      sheetName: 'Balance Sheet',
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
          <title>Balance Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin: 30px 0; }
            .section h2 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 2px solid #666; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .row.total { border-top: 2px solid #333; border-bottom: 2px solid #333; font-weight: bold; font-size: 16px; margin-top: 10px; }
            .row label { color: #666; }
            .row value { font-weight: 600; }
            .balanced { text-align: center; padding: 20px; background: #d4edda; color: #155724; border-radius: 8px; margin-top: 30px; font-size: 16px; font-weight: bold; }
            .unbalanced { text-align: center; padding: 20px; background: #f8d7da; color: #721c24; border-radius: 8px; margin-top: 30px; font-size: 16px; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Balance Sheet</h1>
            <p>As of ${format(new Date(asOfDate), 'dd MMMM yyyy')}</p>
          </div>

          <div class="section">
            <h2>Assets</h2>
            <div class="row">
              <label>Cash and Bank</label>
              <value>₹${data.assets.cashAndBank.toLocaleString()}</value>
            </div>
            <div class="row">
              <label>Accounts Receivable</label>
              <value>₹${data.assets.accountsReceivable.toLocaleString()}</value>
            </div>
            <div class="row total">
              <label>Total Assets</label>
              <value>₹${data.assets.totalAssets.toLocaleString()}</value>
            </div>
          </div>

          <div class="section">
            <h2>Liabilities</h2>
            <div class="row">
              <label>Accounts Payable</label>
              <value>₹${data.liabilities.accountsPayable.toLocaleString()}</value>
            </div>
            <div class="row total">
              <label>Total Liabilities</label>
              <value>₹${data.liabilities.totalLiabilities.toLocaleString()}</value>
            </div>
          </div>

          <div class="section">
            <h2>Equity</h2>
            <div class="row">
              <label>Retained Earnings</label>
              <value>₹${data.equity.retainedEarnings.toLocaleString()}</value>
            </div>
            <div class="row total">
              <label>Total Equity</label>
              <value>₹${data.equity.totalEquity.toLocaleString()}</value>
            </div>
          </div>

          <div class="${data.isBalanced ? 'balanced' : 'unbalanced'}">
            ${
              data.isBalanced
                ? '✓ Balance Sheet is Balanced'
                : '⚠ Balance Sheet is NOT Balanced - Please review'
            }
          </div>

          <div class="footer">
            <p>Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
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
            <h1 className="text-3xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground">Financial position statement</p>
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

        {/* Date Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asOfDate">As of Date</Label>
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error loading balance sheet</div>
        ) : data ? (
          <>
            {/* Balance Status */}
            <Card className={data.isBalanced ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Balance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-center py-4 text-lg font-semibold ${
                    data.isBalanced ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {data.isBalanced ? '✓ Balance Sheet is Balanced' : '⚠ Balance Sheet is NOT Balanced'}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Assets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Cash and Bank</span>
                      <span className="font-semibold">₹{data.assets.cashAndBank.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Accounts Receivable</span>
                      <span className="font-semibold">
                        ₹{data.assets.accountsReceivable.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                      <span className="font-bold text-lg">Total Assets</span>
                      <span className="font-bold text-2xl text-green-600">
                        ₹{data.assets.totalAssets.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities & Equity */}
              <div className="space-y-6">
                {/* Liabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      Liabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Accounts Payable</span>
                        <span className="font-semibold">
                          ₹{data.liabilities.accountsPayable.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                        <span className="font-bold">Total Liabilities</span>
                        <span className="font-bold text-xl text-red-600">
                          ₹{data.liabilities.totalLiabilities.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Equity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Equity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Retained Earnings</span>
                        <span className="font-semibold">
                          ₹{data.equity.retainedEarnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                        <span className="font-bold">Total Equity</span>
                        <span className="font-bold text-xl text-blue-600">
                          ₹{data.equity.totalEquity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Accounting Equation */}
            <Card>
              <CardHeader>
                <CardTitle>Accounting Equation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-lg">
                    <span className="font-semibold">Assets</span> ={' '}
                    <span className="font-semibold">Liabilities</span> +{' '}
                    <span className="font-semibold">Equity</span>
                  </div>
                  <div className="text-2xl font-bold">
                    <span className="text-green-600">₹{data.totalAssetsAndEquity.toLocaleString()}</span> ={' '}
                    <span className="text-red-600">
                      ₹{data.liabilities.totalLiabilities.toLocaleString()}
                    </span>{' '}
                    +{' '}
                    <span className="text-blue-600">₹{data.equity.totalEquity.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
};
