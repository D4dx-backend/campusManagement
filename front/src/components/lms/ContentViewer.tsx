import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X, Download, ExternalLink, Play, FileText, Image as ImageIcon,
  BookOpen, Headphones, Video, Link2, Monitor, Users
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { LessonContent, progressApi } from '@/services/lmsService';

interface ContentViewerProps {
  content: LessonContent | null;
  open: boolean;
  onClose: () => void;
}

const contentTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  lesson: { label: 'Lesson', icon: <BookOpen className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  video: { label: 'Video', icon: <Video className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
  document: { label: 'Document', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  image: { label: 'Image', icon: <ImageIcon className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  link: { label: 'Link', icon: <Link2 className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  interactive: { label: 'Interactive', icon: <Monitor className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-700' },
  audio: { label: 'Audio', icon: <Headphones className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700' },
  meeting: { label: 'Live Class', icon: <Users className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700' },
};

/** Extract YouTube video ID from various URL formats */
function getYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isYoutubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function isMeetingUrl(url: string): boolean {
  return /meet\.google\.com|zoom\.us|teams\.microsoft\.com/.test(url);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ContentViewer = ({ content, open, onClose }: ContentViewerProps) => {
  const startTimeRef = useRef(Date.now());
  const audioRef = useRef<HTMLAudioElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Track progress on open/close
  useEffect(() => {
    if (open && content) {
      startTimeRef.current = Date.now();
    }
    return () => {
      if (content && startTimeRef.current) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (timeSpent > 2) {
          progressApi.trackProgress({ contentId: content._id, timeSpent }).catch(() => {});
        }
      }
    };
  }, [open, content?._id]);

  if (!content) return null;

  const meta = contentTypeLabels[content.contentType] || contentTypeLabels.lesson;
  const fileUrl = content.fileUrl;
  const extUrl = content.externalUrl || content.meetingUrl;

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = content.fileName || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderContent = () => {
    switch (content.contentType) {
      // ── LESSON (text/HTML) ──
      case 'lesson':
        return (
          <ScrollArea className="max-h-[60vh]">
            <div
              className="prose prose-sm max-w-none dark:prose-invert px-1"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body || '<em>No content</em>') }}
            />
          </ScrollArea>
        );

      // ── VIDEO ──
      case 'video': {
        const url = extUrl || fileUrl || '';
        const ytId = getYoutubeId(url);
        if (ytId) {
          return (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
                title={content.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        // Direct video file
        if (fileUrl) {
          return (
            <video
              controls
              className="w-full rounded-lg max-h-[60vh]"
              src={fileUrl}
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          );
        }
        // External non-YouTube video link
        if (extUrl) {
          return (
            <div className="text-center py-8 space-y-3">
              <Video className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">External video link</p>
              <Button onClick={() => window.open(extUrl, '_blank', 'noopener')} className="gap-2">
                <ExternalLink className="w-4 h-4" /> Open Video
              </Button>
            </div>
          );
        }
        return <p className="text-muted-foreground text-center py-8">No video available</p>;
      }

      // ── AUDIO ──
      case 'audio': {
        const audioSrc = fileUrl || extUrl || '';
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="p-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Headphones className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
            {audioSrc ? (
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioSrc}
                preload="metadata"
              >
                Your browser does not support audio playback.
              </audio>
            ) : (
              <p className="text-muted-foreground text-center">No audio available</p>
            )}
            {content.duration && (
              <p className="text-xs text-muted-foreground text-center">
                Duration: {Math.floor(content.duration / 60)}m {content.duration % 60}s
              </p>
            )}
          </div>
        );
      }

      // ── DOCUMENT (PDF, Office) ──
      case 'document': {
        if (fileUrl) {
          const isPdf = content.mimeType === 'application/pdf' || fileUrl.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            return (
              <div className="space-y-3">
                <iframe
                  src={`${fileUrl}#toolbar=1&navpanes=0`}
                  className="w-full rounded-lg border"
                  style={{ height: '60vh' }}
                  title={content.title}
                />
                {content.isDownloadable && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                      <Download className="w-4 h-4" /> Download PDF
                    </Button>
                  </div>
                )}
              </div>
            );
          }
          // Non-PDF document
          return (
            <div className="text-center py-8 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="font-medium">{content.fileName || 'Document'}</p>
              {content.fileSize && <p className="text-xs text-muted-foreground">{formatFileSize(content.fileSize)}</p>}
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
          );
        }
        return <p className="text-muted-foreground text-center py-8">No document available</p>;
      }

      // ── IMAGE ──
      case 'image':
        return (
          <div className="flex flex-col items-center gap-3">
            {fileUrl ? (
              <>
                <img
                  src={fileUrl}
                  alt={content.title}
                  className="max-w-full max-h-[60vh] rounded-lg object-contain"
                  onLoad={() => setImageLoaded(true)}
                />
                {content.isDownloadable && imageLoaded && (
                  <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" /> Download Image
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground py-8">No image available</p>
            )}
          </div>
        );

      // ── LINK ──
      case 'link': {
        const linkUrl = extUrl || '';
        return (
          <div className="text-center py-8 space-y-4">
            <Link2 className="w-12 h-12 mx-auto text-purple-500" />
            <p className="text-sm text-muted-foreground break-all px-4">{linkUrl}</p>
            {linkUrl && (
              <Button onClick={() => window.open(linkUrl, '_blank', 'noopener')} className="gap-2">
                <ExternalLink className="w-4 h-4" /> Open Link
              </Button>
            )}
            {content.body && (
              <div className="text-left mt-4 border-t pt-4">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
                />
              </div>
            )}
          </div>
        );
      }

      // ── INTERACTIVE ──
      case 'interactive': {
        const iframeUrl = extUrl || '';
        if (iframeUrl) {
          return (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg border"
                src={iframeUrl}
                title={content.title}
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          );
        }
        return <p className="text-muted-foreground text-center py-8">No interactive content available</p>;
      }

      // ── MEETING / LIVE CLASS ──
      case 'meeting': {
        const meetUrl = content.meetingUrl || extUrl || '';
        return (
          <div className="text-center py-8 space-y-4">
            <div className="p-6 rounded-full bg-pink-100 dark:bg-pink-900/30 inline-block">
              <Users className="w-12 h-12 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold">Live Class / Meeting</h3>
            {content.body && (
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{content.body}</p>
            )}
            {meetUrl ? (
              <Button
                size="lg"
                onClick={() => window.open(meetUrl, '_blank', 'noopener')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Join Meeting
              </Button>
            ) : (
              <p className="text-muted-foreground">No meeting link available</p>
            )}
            {meetUrl && (
              <p className="text-xs text-muted-foreground break-all px-4">{meetUrl}</p>
            )}
          </div>
        );
      }

      default:
        return <p className="text-muted-foreground text-center py-8">Content type not supported</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 py-3 sm:px-6 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg leading-tight pr-8">{content.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className={`text-xs ${meta.color}`}>
                  {meta.icon}
                  <span className="ml-1">{meta.label}</span>
                </Badge>
                {content.tags?.length > 0 && content.tags.slice(0, 3).map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentViewer;
