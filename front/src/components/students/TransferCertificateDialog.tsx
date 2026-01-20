import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Download, Loader2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TransferCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onSuccess: () => void;
}

export const TransferCertificateDialog = ({
  open,
  onOpenChange,
  student,
  onSuccess,
}: TransferCertificateDialogProps) => {
  const [transferSchoolName, setTransferSchoolName] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [tcData, setTcData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/students/${student._id}/transfer`, {
        transferSchoolName: transferSchoolName || undefined,
        transferDate,
        reason,
        remarks,
      });

      if (response.data.success) {
        setTcData(response.data.data.transferCertificate);
        setShowPreview(true);
        toast({
          title: 'Success',
          description: 'Transfer certificate generated successfully',
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate transfer certificate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TC_${student.admissionNo}_${new Date().getTime()}.pdf`);

      toast({
        title: 'Downloaded',
        description: 'Transfer certificate downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (showPreview && tcData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Certificate</DialogTitle>
            <DialogDescription>
              Preview and download the transfer certificate
            </DialogDescription>
          </DialogHeader>

          {/* Certificate Preview */}
          <div ref={certificateRef} className="bg-white p-8 border-2 border-gray-800">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold uppercase mb-2">Transfer Certificate</h1>
              <p className="text-sm">{tcData.currentSchool.name}</p>
              <p className="text-xs text-muted-foreground">{tcData.currentSchool.address}</p>
              <div className="border-b-2 border-gray-800 mt-4 mb-4"></div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">TC No:</span> {tcData.admissionNo}/TC/{new Date().getFullYear()}
                </div>
                <div className="text-right">
                  <span className="font-semibold">Date:</span> {new Date(tcData.generatedDate).toLocaleDateString('en-IN')}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-3">
                  <span className="font-semibold">Student Name:</span>
                  <span className="col-span-2 uppercase">{tcData.studentName}</span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-semibold">Admission No:</span>
                  <span className="col-span-2">{tcData.admissionNo}</span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-semibold">Class/Division:</span>
                  <span className="col-span-2">{tcData.class} - {tcData.division}</span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-semibold">Date of Birth:</span>
                  <span className="col-span-2">{new Date(tcData.dateOfBirth).toLocaleDateString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-semibold">Date of Admission:</span>
                  <span className="col-span-2">{new Date(tcData.admissionDate).toLocaleDateString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-semibold">Date of Leaving:</span>
                  <span className="col-span-2">{new Date(tcData.transferDate).toLocaleDateString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-3">
                  <span className="font-semibold">Guardian Name:</span>
                  <span className="col-span-2">{tcData.guardianName}</span>
                </div>

                {tcData.transferSchoolName && tcData.transferSchoolName !== 'Not Specified' && (
                  <div className="grid grid-cols-3">
                    <span className="font-semibold">Transfer To:</span>
                    <span className="col-span-2">{tcData.transferSchoolName}</span>
                  </div>
                )}

                {tcData.reason && (
                  <div className="grid grid-cols-3">
                    <span className="font-semibold">Reason:</span>
                    <span className="col-span-2">{tcData.reason}</span>
                  </div>
                )}

                {tcData.remarks && (
                  <div className="grid grid-cols-3">
                    <span className="font-semibold">Remarks:</span>
                    <span className="col-span-2">{tcData.remarks}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6 mt-8">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground">Issued by: {tcData.generatedBy}</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-800 pt-2 w-48">
                      <p className="text-xs font-semibold">Principal/Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground mt-4">
                <p>This is a computer-generated certificate</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setShowPreview(false);
              setTcData(null);
              onOpenChange(false);
            }}>
              Close
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Transfer Certificate</DialogTitle>
          <DialogDescription>
            Create a transfer certificate for {student?.firstName} {student?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Info */}
          <div className="rounded-lg bg-muted p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {student?.firstName} {student?.lastName}
              </div>
              <div>
                <span className="font-medium">Admission No:</span> {student?.admissionNo}
              </div>
              <div>
                <span className="font-medium">Class:</span> {student?.class?.name}
              </div>
              <div>
                <span className="font-medium">Division:</span> {student?.division?.name}
              </div>
            </div>
          </div>

          {/* Transfer School (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="transferSchool">Transfer To School (Optional)</Label>
            <Input
              id="transferSchool"
              placeholder="Leave blank if not transferring to specific school"
              value={transferSchoolName}
              onChange={(e) => setTransferSchoolName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave this blank to generate certificate without destination school
            </p>
          </div>

          {/* Transfer Date */}
          <div className="space-y-2">
            <Label htmlFor="transferDate">Date of Leaving *</Label>
            <Input
              id="transferDate"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              placeholder="e.g., Parent transfer, Relocation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Additional remarks or notes"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate Certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
