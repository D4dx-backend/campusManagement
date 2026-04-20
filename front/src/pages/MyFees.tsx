import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';
import { studentPortalApi } from '@/services/studentPortalService';
import { useCurrency } from '@/hooks/useCurrency';

const MyFees = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-fees'],
    queryFn: () => studentPortalApi.getMyFees(),
  });
  const { formatCurrency } = useCurrency();

  const fees = data?.data;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Fee Details</h1>
          <p className="text-muted-foreground mt-1">
            {fees?.studentName} — {fees?.className} — Adm No: {fees?.admissionNo}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !fees ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No fee information available.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                      <p className="text-xl font-bold">{formatCurrency(fees.summary.totalDue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(fees.summary.totalPaid)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    {fees.summary.balance > 0 ? (
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={`text-xl font-bold ${fees.summary.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fees.summary.balance > 0 ? formatCurrency(fees.summary.balance) : 'Fully Paid'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Structure */}
            {fees.feeStructures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fee Structure — {fees.academicYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Fee Type</th>
                          <th className="text-left py-2 font-medium">Title</th>
                          <th className="text-right py-2 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.feeStructures.map((fs: any) => (
                          <tr key={fs._id} className="border-b last:border-b-0">
                            <td className="py-2">{fs.feeTypeName}</td>
                            <td className="py-2">{fs.title}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(fs.amount)}</td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td className="py-2" colSpan={2}>Total</td>
                          <td className="py-2 text-right">{formatCurrency(fees.summary.totalDue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {fees.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Receipt</th>
                          <th className="text-left py-2 font-medium">Date</th>
                          <th className="text-left py-2 font-medium">Method</th>
                          <th className="text-right py-2 font-medium">Amount</th>
                          <th className="text-center py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.payments.map((p: any) => (
                          <tr key={p._id} className="border-b last:border-b-0">
                            <td className="py-2 font-mono text-xs">{p.receiptNo}</td>
                            <td className="py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td className="py-2 capitalize">{p.paymentMethod}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
                            <td className="py-2 text-center">
                              <Badge variant={p.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                                {p.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MyFees;
