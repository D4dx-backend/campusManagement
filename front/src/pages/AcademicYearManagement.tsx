import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Star, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const AcademicYearManagement = () => {
  const { toast } = useToast();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      const res = await academicYearApi.getAll({ limit: 100, sortBy: 'name', sortOrder: 'desc' });
      setYears(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load academic years', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredYears = years.filter(y => {
    const matchSearch = !searchTerm || y.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterValues.status || y.status === filterValues.status;
    return matchSearch && matchStatus;
  });

  const totalItems = filteredYears.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedYears = filteredYears.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const config = pageConfigurations.academicYears;

  const handleFilterChange = (values: any) => { setFilterValues(values); setCurrentPage(1); };
  const handleFilterReset = () => { setFilterValues({}); setCurrentPage(1); };

  const openCreate = () => {
    setEditing(null);
    const currentYear = new Date().getFullYear();
    const month = new Date().getMonth();
    const startYear = month >= 3 ? currentYear : currentYear - 1;
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

        <DataTable
          searchPlaceholder="Search academic years..."
          searchValue={searchTerm}
          onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'academic_years',
            columns: config.exportColumns.map(col => ({
              ...col,
              formatter: col.formatter ? formatters[col.formatter] : undefined
            }))
          }}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: (v) => { setItemsPerPage(v); setCurrentPage(1); }
          }}
          data={paginatedYears}
          isLoading={loading}
          emptyState={{
            icon: <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No academic years found"
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Start Date</th>
                  <th className="text-left p-3 font-semibold">End Date</th>
                  <th className="text-left p-3 font-semibold">Current</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedYears.map((y, i) => (
                  <tr key={y._id} className={`border-b hover:bg-muted/30 ${y.isCurrent ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td className="p-3 font-medium">{y.name}</td>
                    <td className="p-3">{new Date(y.startDate).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(y.endDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      {y.isCurrent ? (
                        <Badge className="bg-green-100 text-green-800"><Star className="w-3 h-3 mr-1" />Current</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setCurrent(y)} className="text-xs">Set as Current</Button>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={y.status === 'active' ? 'default' : 'secondary'}>{y.status}</Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(y)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(y)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>

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
