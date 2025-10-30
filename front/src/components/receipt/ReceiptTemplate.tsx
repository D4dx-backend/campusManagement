import { ReceiptData } from '@/types/receipt';

interface ReceiptTemplateProps {
  data: ReceiptData;
}

export const ReceiptTemplate = ({ data }: ReceiptTemplateProps) => {
  const { config } = data;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 shadow-lg" id="receipt-template">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
        {config.logo && (
          <img 
            src={config.logo} 
            alt="School Logo" 
            className="h-16 w-16 mx-auto mb-4 object-contain"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{config.schoolName}</h1>
        <p className="text-gray-600 text-sm leading-relaxed">{config.address}</p>
        <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
          <span>Phone: {config.phone}</span>
          <span>Email: {config.email}</span>
        </div>
        {config.website && (
          <p className="text-sm text-gray-600 mt-1">Website: {config.website}</p>
        )}
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">FEE RECEIPT</h2>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Receipt No: <strong>{data.receiptNo}</strong></span>
          <span className="text-sm text-gray-600">Date: <strong>{new Date(data.paymentDate).toLocaleDateString()}</strong></span>
        </div>
      </div>

      {/* Student Details */}
      <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Student Details</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Name:</span> <strong>{data.studentName}</strong></div>
            <div><span className="text-gray-600">Class:</span> <strong>{data.class}</strong></div>
            <div><span className="text-gray-600">Admission No:</span> <strong>{data.admissionNo}</strong></div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Fee Type:</span> <strong className="capitalize">{data.feeType}</strong></div>
            <div><span className="text-gray-600">Payment Method:</span> <strong className="capitalize">{data.paymentMethod}</strong></div>
            <div><span className="text-gray-600">Amount:</span> <strong className="text-green-600">₹{data.amount.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-6 p-4 border border-gray-300 rounded-lg">
        <div className="text-sm">
          <span className="text-gray-600">Amount in Words:</span>
          <div className="mt-1 font-medium text-gray-800">
            {/* This would need a number-to-words converter function */}
            Rupees {data.amount.toLocaleString()} Only
          </div>
        </div>
      </div>

      {/* Remarks */}
      {data.remarks && (
        <div className="mb-6">
          <div className="text-sm">
            <span className="text-gray-600">Remarks:</span>
            <div className="mt-1 text-gray-800">{data.remarks}</div>
          </div>
        </div>
      )}

      {/* Tax Information */}
      {config.taxNumber && (
        <div className="mb-6 text-sm text-gray-600">
          <div>Tax Number: {config.taxNumber}</div>
          {config.registrationNumber && (
            <div>Registration Number: {config.registrationNumber}</div>
          )}
        </div>
      )}

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-12 mb-6">
        <div className="text-center">
          <div className="border-t border-gray-400 w-32 mb-2"></div>
          <span className="text-sm text-gray-600">Student Signature</span>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 w-32 mb-2"></div>
          <span className="text-sm text-gray-600">Authorized Signature</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t border-gray-300 pt-4">
        {config.principalName && (
          <p className="text-sm text-gray-600 mb-2">Principal: {config.principalName}</p>
        )}
        {config.footerText && (
          <p className="text-sm text-gray-600 italic">{config.footerText}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          This is a computer generated receipt and does not require signature.
        </p>
      </div>
    </div>
  );
};