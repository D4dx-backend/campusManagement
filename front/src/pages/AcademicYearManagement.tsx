import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';

const AcademicYearManagement = () => {
  const { toast } = useToast();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => { loadYears(); }, []);

  const loadYears = async () => {
    setLoading(true);
    try {
      const res = await academicYearApi.getAll({ limit: 50, sortBy: 'name', sortOrder: 'desc' });
      setYears(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load academic years', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    // Auto-suggest next academic year name
    const currentYear = new Date().getFullYear();
    const month = new Date().getMonth();
    const startYear = month >= 3 ? currentYear : currentYear - 1; // June-based academic year
    setFormData({
      name: `${startYear}-${(startYear + 1).toString().slice(-2)}`,
      startDate: `${startYear}-06-01`,
      endDate: `${startYear + 1}-03-31`,
      isCurrent: false,
      status: 'active'
    });
    setDialogOpen(true);
  };

  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    setFormData({
      name: y.name,
      startDate: y.startDate ? new Date(y.startDate).toISOString().split('T')[0] : '',
      endDate: y.endDate ? new Date(y.endDate).toISOString().split('T')[0] : '',
      isCurrent: y.isCurrent,
      status: y.status
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({ title: 'Validation', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await academicYearApi.update(editing._id, formData);
        toast({ title: 'Success', description: 'Academic year updated' });
      } else {
        await academicYearApi.create(formData);
        toast({ title: 'Success', description: 'Academic year created' });
      }
      setDialogOpen(false);
      loadYears();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (y: AcademicYear) => {
    if (!confirm(`Delete academic year "${y.name}"?`)) return;
    try {
      await academicYearApi.delete(y._id);
      toast({ title: 'Deleted', description: 'Academic year deleted' });
      loadYears();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const setCurrent = async (y: AcademicYear) => {
    try {
      await academicYearApi.update(y._id, { isCurrent: true });
      toast({ title: 'Success', description: `${y.name} set as current academic year` });
      loadYears();
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">ACADEMIC YEARS</h1>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Academic Year</Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : years.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No academic years found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((y, i) => (
                    <TableRow key={y._id} className={y.isCurrent ? 'bg-primary/5' : ''}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{y.name}</TableCell>
                      <TableCell>{new Date(y.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(y.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {y.isCurrent ? (
                          <Badge className="bg-green-100 text-green-800"><Star className="w-3 h-3 mr-1" />Current</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setCurrent(y)} className="text-xs">Set as Current</Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={y.status === 'active' ? 'default' : 'secondary'}>{y.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(y)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(y)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Academic Year' : 'Add Academic Year'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. 2025-26" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Set as Current Year</Label>
                <Switch checked={formData.isCurrent} onCheckedChange={v => setFormData(p => ({ ...p, isCurrent: v }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as 'active' | 'inactive' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default AcademicYearManagement;
