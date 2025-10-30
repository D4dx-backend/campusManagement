import { TextbookIndentReceipt } from '@/types/textbookIndent';

interface TextbookReceiptTemplateProps {
  data: TextbookIndentReceipt;
}

export const TextbookReceiptTemplate = ({ data }: TextbookReceiptTemplateProps) => {
  const { config } = data;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 shadow-lg" id="textbook-receipt-template">
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
        <h2 className="text-xl font-semibold text-gray-800 mb-2">TEXTBOOK ISSUE RECEIPT</h2>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Indent No: <strong>{data.indentNo}</strong></span>
          <span className="text-sm text-gray-600">Issue Date: <strong>{new Date(data.issueDate).toLocaleDateString()}</strong></span>
        </div>
      </div>

      {/* Student Details */}
      <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Student Details</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Name:</span> <strong>{data.studentName}</strong></div>
            <div><span className="text-gray-600">Class:</span> <strong>{data.class}{data.division ? ` - ${data.division}` : ''}</strong></div>
            <div><span className="text-gray-600">Admission No:</span> <strong>{data.admissionNo}</strong></div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Issue Details</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Payment Method:</span> <strong className="capitalize">{data.paymentMethod}</strong></div>
            <div><span className="text-gray-600">Issued By:</span> <strong>{data.issuedBy}</strong></div>
            {data.expectedReturnDate && (
              <div><span className="text-gray-600">Expected Return:</span> <strong>{new Date(data.expectedReturnDate).toLocaleDateString()}</strong></div>
            )}
          </div>
        </div>
      </div>

      {/* Textbook Items */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Textbook Details</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Book Code</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subject</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Qty</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="px-4 py-2 text-sm text-gray-800">{item.bookCode}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{item.title}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{item.subject}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">₹{item.price.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right font-medium">₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-800 text-right">Total Amount:</td>
                <td className="px-4 py-2 text-sm font-bold text-gray-800 text-right">₹{data.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-800 text-right">Paid Amount:</td>
                <td className="px-4 py-2 text-sm font-medium text-green-600 text-right">₹{data.paidAmount.toLocaleString()}</td>
              </tr>
              {data.balanceAmount > 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-sm font-medium text-gray-800 text-right">Balance Amount:</td>
                  <td className="px-4 py-2 text-sm font-medium text-red-600 text-right">₹{data.balanceAmount.toLocaleString()}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-6 p-4 border border-gray-300 rounded-lg">
        <div className="text-sm">
          <span className="text-gray-600">Total Amount in Words:</span>
          <div className="mt-1 font-medium text-gray-800">
            Rupees {data.totalAmount.toLocaleString()} Only
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• All textbooks must be returned in good condition at the end of the academic year.</li>
          <li>• Lost or damaged books will be charged at full replacement cost.</li>
          <li>• Students are responsible for the care and maintenance of issued textbooks.</li>
          <li>• Late return may result in penalty charges as per school policy.</li>
          {data.expectedReturnDate && (
            <li>• Expected return date: <strong>{new Date(data.expectedReturnDate).toLocaleDateString()}</strong></li>
          )}
        </ul>
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
          <span className="text-sm text-gray-600">Parent/Guardian Signature</span>
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