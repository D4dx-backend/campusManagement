import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Printer, 
  FileText, 
  Calendar,
  User,
  BookOpen,
  DollarSign,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { TextbookIndentReceipt } from '@/types/textbookIndent';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TextbookReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: TextbookIndentReceipt | null;
}

export const TextbookReceiptDialog = ({ 
  open, 
  onOpenChange, 
  receiptData 
}: TextbookReceiptDialogProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!receiptData) return null;

  const handlePrint = () => {
    // Show print preview in popup
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(generatePrintableHTML());
      printWindow.document.close();
      
      // Add print functionality to the popup
      printWindow.onload = () => {
        const printButton = printWindow.document.createElement('button');
        printButton.innerHTML = 'Print';
        printButton.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          z-index: 1000;
          font-size: 14px;
        `;
        printButton.onclick = () => {
          printWindow.print();
        };
        printWindow.document.body.appendChild(printButton);
      };
    }
  };

  const handleDownload = async () => {
    try {
      setIsPrinting(true);
      
      // Create a temporary div with the receipt content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatePrintableHTML();
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 800px;
        background: white;
        padding: 20px;
      `;
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Download the PDF
      const fileName = `textbook-receipt-${receiptData.indentNo}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // Clean up
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const generatePrintableHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Textbook Receipt - ${receiptData.indentNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              color: #333;
              line-height: 1.4;
            }
            .container { max-width: 800px; margin: 0 auto; }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 { 
              margin: 0 0 10px 0; 
              font-size: 24px; 
              color: #333; 
            }
            .header h2 { 
              margin: 0; 
              font-size: 18px; 
              color: #666; 
            }
            .receipt-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 25px; 
              padding: 15px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .receipt-info p { margin: 0; }
            .student-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 30px; 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .student-info div p { margin: 5px 0; }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 25px; 
              border: 1px solid #ddd;
            }
            .items-table th, .items-table td { 
              border: 1px solid #ddd; 
              padding: 10px 8px; 
              text-align: left; 
              font-size: 12px;
            }
            .items-table th { 
              background-color: #f5f5f5; 
              font-weight: bold;
              text-align: center;
            }
            .items-table td:nth-last-child(2),
            .items-table td:nth-last-child(1) { text-align: right; }
            .totals { 
              margin: 25px 0; 
              padding: 15px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .totals p { margin: 8px 0; }
            .additional-info { margin: 20px 0; }
            .additional-info p { margin: 8px 0; }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              font-size: 11px; 
              color: #666; 
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .footer p { margin: 5px 0; }
            @media print { 
              body { margin: 0; padding: 15px; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CampusWise - D4Media Institution</h1>
              <h2>Textbook ${receiptData.status === 'returned' ? 'Return' : 'Issue'} Receipt</h2>
            </div>
            
            <div class="receipt-info">
              <p><strong>Receipt No:</strong><br>${receiptData.indentNo}</p>
              <p><strong>Date:</strong><br>${new Date(receiptData.issueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong><br>${receiptData.status.toUpperCase()}</p>
            </div>

            <div class="student-info">
              <div>
                <p><strong>Student Name:</strong> ${receiptData.studentName}</p>
                <p><strong>Admission No:</strong> ${receiptData.admissionNo}</p>
              </div>
              <div>
                <p><strong>Class:</strong> ${receiptData.class}</p>
                ${receiptData.division ? `<p><strong>Division:</strong> ${receiptData.division}</p>` : ''}
              </div>
            </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Book Code</th>
                <th>Title</th>
                <th>Subject</th>
                <th>Qty</th>
                ${receiptData.status !== 'pending' ? '<th>Returned</th>' : ''}
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${receiptData.items.map(item => `
                <tr>
                  <td>${item.bookCode}</td>
                  <td>${item.title}</td>
                  <td>${item.subject}</td>
                  <td>${item.quantity}</td>
                  ${receiptData.status !== 'pending' ? `<td>${item.returnedQuantity || 0}</td>` : ''}
                  <td>₹${item.price.toLocaleString()}</td>
                  <td>₹${item.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

            <div class="totals">
              <p><strong>Total Amount: ₹${receiptData.totalAmount.toLocaleString()}</strong></p>
              <p><strong>Paid Amount: ₹${receiptData.paidAmount.toLocaleString()}</strong></p>
              <p><strong>Balance Amount: ₹${receiptData.balanceAmount.toLocaleString()}</strong></p>
              <p><strong>Payment Method:</strong> ${receiptData.paymentMethod.toUpperCase()}</p>
            </div>

            ${(receiptData.expectedReturnDate || receiptData.remarks) ? `
              <div class="additional-info">
                ${receiptData.expectedReturnDate ? `
                  <p><strong>Expected Return Date:</strong> ${new Date(receiptData.expectedReturnDate).toLocaleDateString()}</p>
                ` : ''}
                ${receiptData.remarks ? `
                  <p><strong>Remarks:</strong> ${receiptData.remarks}</p>
                ` : ''}
              </div>
            ` : ''}

            <div class="footer">
              <p>Issued by: ${receiptData.issuedBy}</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>This is a computer generated receipt.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partially_returned':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'returned':
        return <RotateCcw className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'issued':
        return 'Issued';
      case 'partially_returned':
        return 'Partially Returned';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Textbook Receipt - {receiptData.indentNo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">CampusWise - D4Media Institution</CardTitle>
              <p className="text-lg text-muted-foreground">
                Textbook {receiptData.status === 'returned' ? 'Return' : 'Issue'} Receipt
              </p>
            </CardHeader>
          </Card>

          {/* Receipt Info */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Receipt No</span>
                </div>
                <p className="font-semibold">{receiptData.indentNo}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                </div>
                <p className="font-semibold">{new Date(receiptData.issueDate).toLocaleDateString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(receiptData.status)}
                  <span className="text-sm text-muted-foreground">Status</span>
                </div>
                <Badge variant="outline" className="gap-1">
                  {getStatusLabel(receiptData.status)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-semibold">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission No</p>
                  <p className="font-semibold">{receiptData.admissionNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-semibold">{receiptData.class}</p>
                </div>
                {receiptData.division && (
                  <div>
                    <p className="text-sm text-muted-foreground">Division</p>
                    <p className="font-semibold">{receiptData.division}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Textbook Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Textbook Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Book Code</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Subject</th>
                      <th className="text-center p-2">Qty</th>
                      {receiptData.status !== 'pending' && (
                        <th className="text-center p-2">Returned</th>
                      )}
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.bookCode}</td>
                        <td className="p-2">{item.title}</td>
                        <td className="p-2">{item.subject}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        {receiptData.status !== 'pending' && (
                          <td className="p-2 text-center">{item.returnedQuantity || 0}</td>
                        )}
                        <td className="p-2 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="p-2 text-right">₹{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">₹{receiptData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span className="font-semibold text-green-600">₹{receiptData.paidAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span>Balance Amount:</span>
                  <span className={`font-bold ${receiptData.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{receiptData.balanceAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-semibold capitalize">{receiptData.paymentMethod}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          {(receiptData.expectedReturnDate || receiptData.remarks) && (
            <Card>
              <CardContent className="p-4">
                {receiptData.expectedReturnDate && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Expected Return Date:</span>
                    <span className="ml-2 font-semibold">
                      {new Date(receiptData.expectedReturnDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {receiptData.remarks && (
                  <div>
                    <span className="text-sm text-muted-foreground">Remarks:</span>
                    <p className="mt-1">{receiptData.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              <p>Issued by: {receiptData.issuedBy}</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
              <p className="mt-2">This is a computer generated receipt.</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleDownload} disabled={isPrinting}>
              <Download className="w-4 h-4 mr-2" />
              {isPrinting ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};