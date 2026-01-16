import { forwardRef } from 'react';

interface ExpenseVoucherProps {
  voucherNo: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  approvedBy: string;
  remarks?: string;
  institutionName?: string;
  institutionAddress?: string;
  institutionPhone?: string;
  logo?: string;
}

export const ExpenseVoucher = forwardRef<HTMLDivElement, ExpenseVoucherProps>(
  ({
    voucherNo,
    date,
    category,
    description,
    amount,
    paymentMethod,
    approvedBy,
    remarks,
    institutionName = 'Campus Management System',
    institutionAddress,
    institutionPhone,
    logo
  }, ref) => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    };

    const numberToWords = (num: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

      if (num === 0) return 'Zero';

      const convert = (n: number): string => {
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand ' + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh ' + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + ' Crore ' + convert(n % 10000000);
      };

      const rupees = Math.floor(num);
      const paise = Math.round((num - rupees) * 100);

      let words = convert(rupees).trim() + ' Rupees';
      if (paise > 0) {
        words += ' and ' + convert(paise).trim() + ' Paise';
      }
      return words + ' Only';
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center justify-between">
            {logo && (
              <img src={logo} alt="Logo" className="h-16 w-16 object-contain" />
            )}
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{institutionName}</h1>
              {institutionAddress && (
                <p className="text-sm text-gray-600 mt-1">{institutionAddress}</p>
              )}
              {institutionPhone && (
                <p className="text-sm text-gray-600">Phone: {institutionPhone}</p>
              )}
            </div>
            {logo && <div className="h-16 w-16" />} {/* Spacer for balance */}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold text-red-600">PAYMENT VOUCHER</h2>
          </div>
        </div>

        {/* Voucher Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm">
              <span className="font-semibold">Voucher No:</span> {voucherNo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">
              <span className="font-semibold">Date:</span> {formatDate(date)}
            </p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-2 border-gray-800 mb-6">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="p-3 font-semibold w-1/3 bg-gray-100">Category:</td>
                <td className="p-3 uppercase">{category}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-3 font-semibold bg-gray-100">Description:</td>
                <td className="p-3">{description}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-3 font-semibold bg-gray-100">Amount:</td>
                <td className="p-3 text-lg font-bold">{formatCurrency(amount)}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-3 font-semibold bg-gray-100">Amount in Words:</td>
                <td className="p-3 italic">{numberToWords(amount)}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-3 font-semibold bg-gray-100">Payment Method:</td>
                <td className="p-3 uppercase">{paymentMethod}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-3 font-semibold bg-gray-100">Approved By:</td>
                <td className="p-3">{approvedBy}</td>
              </tr>
              {remarks && (
                <tr>
                  <td className="p-3 font-semibold bg-gray-100">Remarks:</td>
                  <td className="p-3">{remarks}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12 mb-6">
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2">
              <p className="font-semibold">Prepared By</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2">
              <p className="font-semibold">Verified By</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2">
              <p className="font-semibold">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-4 mt-8">
          <p className="text-xs text-gray-600 text-center">
            This is a computer-generated voucher and does not require a physical signature
          </p>
          <p className="text-xs text-gray-600 text-center mt-1">
            Generated on: {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* Duplicate Copy Marker (for printing) */}
        <div className="page-break mt-12 pt-12 border-t-4 border-dashed border-gray-400">
          <p className="text-center font-bold text-gray-500 mb-4">OFFICE COPY</p>
        </div>
      </div>
    );
  }
);

ExpenseVoucher.displayName = 'ExpenseVoucher';
