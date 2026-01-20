import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowRight, Loader2 } from 'lucide-react';

interface PromoteStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudents: any[];
  onSuccess: () => void;
  classes: any[];
  divisions: any[];
}

export const PromoteStudentsDialog = ({
  open,
  onOpenChange,
  selectedStudents,
  onSuccess,
  classes,
  divisions,
}: PromoteStudentsDialogProps) => {
  const [targetClassId, setTargetClassId] = useState('');
  const [targetDivisionId, setTargetDivisionId] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePromote = async () => {
    if (!targetClassId || !targetDivisionId) {
      toast({
        title: 'Error',
        description: 'Please select target class and division',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const studentIds = selectedStudents.map(s => s._id);

      const response = await api.post('/students/promote', {
        studentIds,
        targetClassId,
        targetDivisionId,
        academicYear,
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: response.data.message,
        });
        onSuccess();
        onOpenChange(false);
        
        // Reset form
        setTargetClassId('');
        setTargetDivisionId('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to promote students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c._id === targetClassId);
  const filteredDivisions = divisions.filter(d => d.classId === targetClassId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Promote Students</DialogTitle>
          <DialogDescription>
            Promote {selectedStudents.length} student(s) to a new class and division
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Details */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">Selected Students:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedStudents.map((student) => (
                <div key={student._id} className="text-sm text-muted-foreground">
                  {student.admissionNo} - {student.firstName} {student.lastName}
                </div>
              ))}
            </div>
          </div>

          {/* Target Class */}
          <div className="space-y-2">
            <Label htmlFor="targetClass">Target Class *</Label>
            <Select value={targetClassId} onValueChange={setTargetClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Division */}
          <div className="space-y-2">
            <Label htmlFor="targetDivision">Target Division *</Label>
            <Select 
              value={targetDivisionId} 
              onValueChange={setTargetDivisionId}
              disabled={!targetClassId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target division" />
              </SelectTrigger>
              <SelectContent>
                {filteredDivisions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No divisions for selected class
                  </div>
                ) : (
                  filteredDivisions.map((div) => (
                    <SelectItem key={div._id} value={div._id}>
                      {div.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year</Label>
            <Input
              id="academicYear"
              type="text"
              placeholder="2026"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>

          {/* Preview */}
          {targetClassId && targetDivisionId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-sm">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <span>
                Promoting to <strong>{selectedClass?.name}</strong> - 
                <strong> {filteredDivisions.find(d => d._id === targetDivisionId)?.name}</strong>
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={loading || !targetClassId || !targetDivisionId}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Promote Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
