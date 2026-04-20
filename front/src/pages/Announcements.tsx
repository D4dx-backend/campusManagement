import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Pencil, AlertTriangle, Bell, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import announcementService, { Announcement, CreateAnnouncementData } from '@/services/announcementService';
import { classesApi, Class } from '@/services/classes';
import { divisionsApi, Division } from '@/services/divisions';
import { studentService } from '@/services/studentService';

const typeColors: Record<string, string> = {
  general: 'bg-blue-50 text-blue-700',
  academic: 'bg-purple-50 text-purple-700',
  event: 'bg-green-50 text-green-700',
  emergency: 'bg-red-50 text-red-700',
};
const priorityColors: Record<string, string> = {
  low: 'bg-gray-50 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-700',
};

const scopeLabels: Record<string, string> = {
  organization: 'All Branches (Org-wide)',
  branch: 'Branch',
  class: 'Class',
  division: 'Division',
  student: 'Specific Students',
};

const Announcements = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { branches } = useBranchContext();
  const queryClient = useQueryClient();
  const isOrgAdmin = user?.role === 'org_admin';
  const isPlatformAdmin = user?.role === 'platform_admin';
  const isBranchAdmin = user?.role === 'branch_admin';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = isPlatformAdmin || isOrgAdmin || isBranchAdmin;
  const canCreate = isAdmin || isTeacher;

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');

  // Dropdown data
  const [classes, setClasses] = useState<Class[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [expiresAt, setExpiresAt] = useState('');
  // Targeting
  const [targetScope, setTargetScope] = useState('branch');
  const [targetRoles, setTargetRoles] = useState<string[]>(['all']);
  const [targetBranchIds, setTargetBranchIds] = useState<string[]>([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [targetDivisionId, setTargetDivisionId] = useState('');
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (canCreate) {
      classesApi.getClasses({ limit: 100, status: 'active' }).then((r) => setClasses(r.data || [])).catch(() => {});
    }
  }, [canCreate]);

  // Load divisions when class changes
  useEffect(() => {
    if (targetClassId) {
      divisionsApi.getDivisionsByClass(targetClassId).then((r) => setDivisions(r.data || [])).catch(() => setDivisions([]));
    } else {
      setDivisions([]);
    }
  }, [targetClassId]);

  // Search students when typing
  useEffect(() => {
    if (studentSearch.length >= 2 && targetClassId) {
      studentService.getStudents({ search: studentSearch, classId: targetClassId, limit: 20 }).then((r: any) => {
        setStudents(r?.data || []);
      }).catch(() => {});
    }
  }, [studentSearch, targetClassId]);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', filterType],
    queryFn: () => announcementService.getAll({ type: filterType || undefined, limit: 50 }),
  });
  const announcements: Announcement[] = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (d: CreateAnnouncementData) =>
      editId ? announcementService.update(editId, d) : announcementService.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-unread'] });
      toast({ title: editId ? 'Announcement updated' : 'Announcement published' });
      closeForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => announcementService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-unread'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => announcementService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-unread'] });
      toast({ title: 'All marked as read' });
    },
  });

  const resetForm = () => {
    setTitle(''); setMessage(''); setType('general'); setPriority('normal'); setExpiresAt('');
    setTargetScope('branch'); setTargetRoles(['all']); setTargetBranchIds([]); setTargetClassId('');
    setTargetDivisionId(''); setTargetStudentIds([]); setStudentSearch(''); setEditId(null);
  };
  const closeForm = () => { setCreateOpen(false); resetForm(); };

  const openEdit = (a: Announcement) => {
    setEditId(a._id); setTitle(a.title); setMessage(a.message);
    setType(a.type); setPriority(a.priority);
    setTargetScope(a.targetScope); setTargetRoles(a.targetRoles || ['all']);
    setTargetBranchIds(a.targetBranchIds || []); setTargetClassId(a.targetClassId || '');
    setTargetDivisionId(a.targetDivisionId || '');
    setTargetStudentIds(a.targetStudentIds || []);
    setExpiresAt(a.expiresAt ? a.expiresAt.split('T')[0] : '');
    setCreateOpen(true);
  };

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Title and message are required', variant: 'destructive' });
      return;
    }
    const selectedClass = classes.find((c) => c._id === targetClassId);
    const selectedDiv = divisions.find((d) => d._id === targetDivisionId);
    const selectedBranches = branches.filter((b) => targetBranchIds.includes(b._id));
    const selectedStudents = students.filter((s: any) => targetStudentIds.includes(s._id));

    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      type,
      targetScope,
      targetRoles,
      targetBranchIds: targetScope === 'organization' ? targetBranchIds : [],
      targetBranchNames: targetScope === 'organization' ? selectedBranches.map((b) => b.name) : [],
      targetClassId: ['class', 'division', 'student'].includes(targetScope) ? targetClassId : undefined,
      targetClassName: ['class', 'division', 'student'].includes(targetScope) ? selectedClass?.name : undefined,
      targetDivisionId: targetScope === 'division' ? targetDivisionId : undefined,
      targetDivisionName: targetScope === 'division' ? selectedDiv?.name : undefined,
      targetStudentIds: targetScope === 'student' ? targetStudentIds : [],
      targetStudentNames: targetScope === 'student' ? selectedStudents.map((s: any) => s.name) : [],
      priority,
      expiresAt: expiresAt || undefined,
    });
  };

  const toggleRole = (role: string) => {
    if (role === 'all') {
      setTargetRoles(['all']);
    } else {
      const newRoles = targetRoles.filter((r) => r !== 'all');
      if (newRoles.includes(role)) {
        const filtered = newRoles.filter((r) => r !== role);
        setTargetRoles(filtered.length > 0 ? filtered : ['all']);
      } else {
        setTargetRoles([...newRoles, role]);
      }
    }
  };

  const toggleStudent = (id: string) => {
    setTargetStudentIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleBranch = (id: string) => {
    setTargetBranchIds((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getScopeDescription = (a: Announcement) => {
    switch (a.targetScope) {
      case 'organization':
        return a.targetBranchNames?.length ? `Branches: ${a.targetBranchNames.join(', ')}` : 'All Branches';
      case 'branch': return 'Branch-wide';
      case 'class': return a.targetClassName || 'Class';
      case 'division': return `${a.targetClassName} - ${a.targetDivisionName || 'Division'}`;
      case 'student': return `${a.targetStudentNames?.length || 0} student(s)`;
      default: return '';
    }
  };

  const getRoleDescription = (roles: string[]) => {
    if (!roles || roles.includes('all')) return 'Everyone';
    return roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
  };

  // Available scopes based on role
  const availableScopes = () => {
    if (isPlatformAdmin || isOrgAdmin) return ['organization', 'branch', 'class', 'division', 'student'];
    if (isBranchAdmin) return ['branch', 'class', 'division', 'student'];
    if (isTeacher) return ['branch', 'class', 'division', 'student'];
    return [];
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Announcements
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">
              {canCreate ? 'Create and manage announcements' : 'View announcements'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()}>
                <CheckCheck className="w-4 h-4 mr-1" />Mark All Read
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />New Announcement
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : announcements.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <Card
                key={a._id}
                className={`${a.priority === 'urgent' ? 'border-red-300' : a.priority === 'high' ? 'border-orange-200' : ''} ${!a.isRead ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : ''}`}
                onClick={() => { if (!a.isRead) markReadMutation.mutate(a._id); }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {!a.isRead && <Bell className="w-4 h-4 text-blue-600" />}
                        {a.priority === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={typeColors[a.type]}>{a.type}</Badge>
                        <Badge variant="outline" className={priorityColors[a.priority]}>{a.priority}</Badge>
                        <Badge variant="secondary">{getScopeDescription(a)}</Badge>
                        <Badge variant="outline">{getRoleDescription(a.targetRoles)}</Badge>
                      </div>
                    </div>
                    {(isAdmin || a.createdBy === user?._id) && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(a._id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{a.message}</p>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>By {a.createdByName} ({a.createdByRole})</span>
                    <span>{formatDate(a.createdAt)} {formatTime(a.createdAt)}</span>
                    {a.expiresAt && <span>Expires: {formatDate(a.expiresAt)}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={createOpen} onOpenChange={(v) => { if (!v) closeForm(); else setCreateOpen(true); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div>
                <Label>Message *</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── TARGETING ── */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <p className="text-sm font-semibold">Targeting</p>

                <div>
                  <Label>Scope</Label>
                  <Select value={targetScope} onValueChange={(v) => {
                    setTargetScope(v);
                    setTargetBranchIds([]); setTargetClassId(''); setTargetDivisionId('');
                    setTargetStudentIds([]); setStudentSearch('');
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableScopes().map((s) => (
                        <SelectItem key={s} value={s}>{scopeLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Org-wide: optional branch selection */}
                {targetScope === 'organization' && branches.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Select branches (leave empty for all)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto">
                      {branches.map((b) => (
                        <label key={b._id} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={targetBranchIds.includes(b._id)} onCheckedChange={() => toggleBranch(b._id)} />
                          {b.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Class selection (for class/division/student scope) */}
                {['class', 'division', 'student'].includes(targetScope) && (
                  <div>
                    <Label>Class</Label>
                    <Select value={targetClassId} onValueChange={(v) => { setTargetClassId(v); setTargetDivisionId(''); setTargetStudentIds([]); }}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Division selection */}
                {targetScope === 'division' && divisions.length > 0 && (
                  <div>
                    <Label>Division</Label>
                    <Select value={targetDivisionId} onValueChange={setTargetDivisionId}>
                      <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                      <SelectContent>
                        {divisions.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Student selection */}
                {targetScope === 'student' && targetClassId && (
                  <div>
                    <Label>Search & Select Students</Label>
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Type student name..."
                      className="mb-2"
                    />
                    {students.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                        {students.map((s: any) => (
                          <label key={s._id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={targetStudentIds.includes(s._id)} onCheckedChange={() => toggleStudent(s._id)} />
                            {s.name} <span className="text-xs text-muted-foreground">({s.admissionNo})</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {targetStudentIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{targetStudentIds.length} student(s) selected</p>
                    )}
                  </div>
                )}

                {/* Role filter (for org/branch scope) */}
                {['organization', 'branch'].includes(targetScope) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Who should see this?</Label>
                    <div className="flex gap-4 mt-1">
                      {['all', 'students', 'teachers', 'staff'].map((r) => (
                        <label key={r} className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={r === 'all' ? targetRoles.includes('all') : targetRoles.includes(r)}
                            onCheckedChange={() => toggleRole(r)}
                          />
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Expires On (optional)</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editId ? 'Update' : 'Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Announcements;
