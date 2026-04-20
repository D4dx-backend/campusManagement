import { forwardRef } from 'react';
import { amountToWords, formatCurrencyAmount } from '@/utils/currency';

interface ExpenseVoucherProps {
  voucherNo: string;
  date: Date | string;
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
  currency?: string;
  currencySymbol?: string;
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
    logo,
    currency = 'BHD',
    currencySymbol,
  }, ref) => {
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-BH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const formatCurrency = (amount: number) => {
      return formatCurrencyAmount(amount, currencySymbol || currency);
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
                <td className="p-3 italic">{amountToWords(amount, currency)}</td>
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
            Generated on: {new Date().toLocaleString('en-BH')}
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
