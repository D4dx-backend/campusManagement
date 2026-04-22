import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Pencil, Trash2, Loader2, ArrowLeft, FileText, Video, Image, Link as LinkIcon,
  Layers, Upload, Eye, Globe, Download, ExternalLink, Music, VideoIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chapterApi, Chapter, contentApi, LessonContent } from '@/services/lmsService';

type ContentType = LessonContent['contentType'];

const contentTypeConfig: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
  lesson: { label: 'Lesson', icon: <FileText className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  video: { label: 'Video', icon: <Video className="w-4 h-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  document: { label: 'Document', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  image: { label: 'Image', icon: <Image className="w-4 h-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  link: { label: 'Link', icon: <LinkIcon className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  interactive: { label: 'Interactive', icon: <Layers className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  audio: { label: 'Audio', icon: <Music className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  meeting: { label: 'Meeting', icon: <VideoIcon className="w-4 h-4" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'outline' },
};

const ChapterContent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId: string }>();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId') || '';
  const subjectId = searchParams.get('subjectId') || '';

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LessonContent | null>(null);
  const [previewItem, setPreviewItem] = useState<LessonContent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    contentType: 'lesson' as ContentType,
    body: '',
    externalUrl: '',
    duration: 0,
    sortOrder: 0,
    status: 'draft' as 'draft' | 'published' | 'archived',
    tags: '',
    meetingUrl: '',
    isDownloadable: false
  });

  useEffect(() => {
    if (chapterId) {
      loadChapter();
      loadContents();
    }
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const res = await chapterApi.getById(chapterId!);
      setChapter(res.data);
    } catch { /* ignore */ }
  };

  const loadContents = async () => {
    setLoading(true);
    try {
      const res = await contentApi.getAll({
        chapterId,
        limit: 100,
        sortBy: 'sortOrder',
        sortOrder: 'asc'
      });
      setContents(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while loading content. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedFile(null);
    setFormData({
      title: '',
      contentType: 'lesson',
      body: '',
      externalUrl: '',
      duration: 0,
      sortOrder: contents.length,
      status: 'draft',
      tags: '',
      meetingUrl: '',
      isDownloadable: false
    });
    setDialogOpen(true);
  };

  const openEdit = (c: LessonContent) => {
    setEditing(c);
    setSelectedFile(null);
    setFormData({
      title: c.title,
      contentType: c.contentType,
      body: c.body || '',
      externalUrl: c.externalUrl || '',
      duration: c.duration || 0,
      sortOrder: c.sortOrder,
      status: c.status,
      tags: (c.tags || []).join(', '),
      meetingUrl: c.meetingUrl || '',
      isDownloadable: c.isDownloadable || false
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: 'Validation', description: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      if (selectedFile || formData.contentType === 'document' || formData.contentType === 'image' || formData.contentType === 'audio') {
        // Use FormData for file upload
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('contentType', formData.contentType);
        fd.append('body', formData.body);
        fd.append('externalUrl', formData.externalUrl);
        fd.append('duration', String(formData.duration));
        fd.append('sortOrder', String(formData.sortOrder));
        fd.append('status', formData.status);
        fd.append('tags', JSON.stringify(tags));
        fd.append('chapterId', chapterId!);
        fd.append('subjectId', subjectId);
        fd.append('classId', classId);
        if (formData.meetingUrl) fd.append('meetingUrl', formData.meetingUrl);
        fd.append('isDownloadable', String(formData.isDownloadable));
        if (selectedFile) fd.append('file', selectedFile);

        if (editing) {
          await contentApi.update(editing._id, fd);
          toast({ title: 'Success', description: 'Content updated' });
        } else {
          await contentApi.create(fd);
          toast({ title: 'Success', description: 'Content created' });
        }
      } else {
        // JSON request (no file)
        const payload = {
          title: formData.title,
          contentType: formData.contentType,
          body: formData.body,
          externalUrl: formData.externalUrl || undefined,
          duration: formData.duration || undefined,
          sortOrder: formData.sortOrder,
          status: formData.status,
          tags,
          chapterId: chapterId!,
          subjectId,
          classId,
          meetingUrl: formData.meetingUrl || undefined,
          isDownloadable: formData.isDownloadable
        };
        if (editing) {
          await contentApi.update(editing._id, payload);
          toast({ title: 'Success', description: 'Content updated' });
        } else {
          await contentApi.create(payload);
          toast({ title: 'Success', description: 'Content created' });
        }
      }
      setDialogOpen(false);
      loadContents();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while saving. Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: LessonContent) => {
    if (!confirm(`Delete "${c.title}"?`)) return;
    try {
      await contentApi.delete(c._id);
      toast({ title: 'Deleted', description: 'Content deleted' });
      loadContents();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while deleting. Please try again.', variant: 'destructive' });
    }
  };

  const handlePublish = async (c: LessonContent) => {
    try {
      await contentApi.publish(c._id);
      toast({ title: 'Published', description: `"${c.title}" is now published` });
      loadContents();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong while publishing. Please try again.', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const chapterName = chapter
    ? `Chapter ${chapter.chapterNumber}: ${chapter.name}`
    : 'Loading...';

  const showFileUpload = ['document', 'image', 'video', 'audio'].includes(formData.contentType);
  const showExternalUrl = ['video', 'link', 'interactive', 'audio'].includes(formData.contentType);
  const showBody = ['lesson'].includes(formData.contentType);
  const showDuration = ['video', 'audio'].includes(formData.contentType);
  const showMeetingUrl = formData.contentType === 'meeting';
  const showDownloadable = ['document', 'image', 'audio'].includes(formData.contentType);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/lms/chapters?classId=${classId}&subjectId=${subjectId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chapter Content</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{chapterName}</p>
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Content
              {contents.length > 0 && <span className="text-muted-foreground font-normal ml-2">({contents.length})</span>}
            </h2>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : contents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-medium mb-1">No content yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Add lessons, videos, documents or links to this chapter</p>
                <Button onClick={openCreate} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {contents.map((c, idx) => {
                const cfg = contentTypeConfig[c.contentType] || contentTypeConfig.lesson;
                const st = statusConfig[c.status] || statusConfig.draft;
                return (
                  <Card key={c._id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{c.title}</h3>
                              <Badge variant="outline" className="text-[10px] flex-shrink-0">{cfg.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {c.fileName && <span>{c.fileName} ({formatFileSize(c.fileSize)})</span>}
                              {c.duration && <span>{Math.floor(c.duration / 60)}:{(c.duration % 60).toString().padStart(2, '0')} min</span>}
                              {c.tags?.length > 0 && <span>Tags: {c.tags.join(', ')}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                          <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                          {c.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => handlePublish(c)} className="text-xs h-7">
                              <Globe className="w-3 h-3 mr-1" />
                              Publish
                            </Button>
                          )}
                          {(c.fileUrl || c.externalUrl) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => window.open(c.fileUrl || c.externalUrl, '_blank')}
                              title="Open"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(c)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Content' : 'Add Content'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Introduction to Photosynthesis"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Content Type</Label>
                <Select
                  value={formData.contentType}
                  onValueChange={v => setFormData(prev => ({ ...prev, contentType: v as ContentType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">📝 Lesson (Text)</SelectItem>
                    <SelectItem value="video">🎬 Video</SelectItem>
                    <SelectItem value="document">📄 Document (PDF/DOC)</SelectItem>
                    <SelectItem value="image">🖼️ Image</SelectItem>
                    <SelectItem value="link">🔗 External Link</SelectItem>
                    <SelectItem value="interactive">⚡ Interactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={v => setFormData(prev => ({ ...prev, status: v as 'draft' | 'published' | 'archived' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lesson body */}
            {showBody && (
              <div className="grid gap-2">
                <Label>Content Body</Label>
                <Textarea
                  value={formData.body}
                  onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write the lesson content here..."
                  rows={8}
                />
              </div>
            )}

            {/* File upload */}
            {showFileUpload && (
              <div className="grid gap-2">
                <Label>Upload File</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={
                      formData.contentType === 'image' ? 'image/*' :
                      formData.contentType === 'video' ? 'video/*,audio/*' :
                      formData.contentType === 'audio' ? 'audio/*' :
                      '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'
                    }
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  {selectedFile ? (
                    <p className="text-sm font-medium">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
                  ) : editing?.fileName ? (
                    <p className="text-sm text-muted-foreground">Current: {editing.fileName} — Click to replace</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  )}
                </div>
              </div>
            )}

            {/* External URL */}
            {showExternalUrl && (
              <div className="grid gap-2">
                <Label>External URL</Label>
                <Input
                  value={formData.externalUrl}
                  onChange={e => setFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            )}

            {/* Duration */}
            {showDuration && (
              <div className="grid gap-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  placeholder="Duration in seconds"
                />
              </div>
            )}

            {/* Meeting URL */}
            {showMeetingUrl && (
              <div className="grid gap-2">
                <Label>Meeting URL</Label>
                <Input
                  value={formData.meetingUrl}
                  onChange={e => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                  placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                />
              </div>
            )}

            {/* Downloadable toggle */}
            {showDownloadable && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isDownloadable}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, isDownloadable: v }))}
                />
                <Label>Allow students to download this file</Label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={e => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="biology, plants, science"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ChapterContent;
