import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import announcementService, { Announcement } from '@/services/announcementService';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery({
    queryKey: ['announcement-unread'],
    queryFn: () => announcementService.getUnreadCount(),
    refetchInterval: 30000,
  });
  const unreadCount: number = countData?.data?.count || 0;

  const { data: recentData } = useQuery({
    queryKey: ['announcements', 'recent-unread'],
    queryFn: () => announcementService.getAll({ limit: 5 }),
    enabled: open,
  });
  const recent: Announcement[] = recentData?.data || [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => announcementService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-unread'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => announcementService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-unread'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setOpen(false);
    },
  });

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const priorityDot: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-400',
    normal: 'bg-blue-400',
    low: 'bg-gray-300',
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => markAllReadMutation.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No announcements</p>
            ) : (
              recent.map((a) => (
                <button
                  key={a._id}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${
                    !a.isRead ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => {
                    if (!a.isRead) markReadMutation.mutate(a._id);
                    setOpen(false);
                    navigate('/announcements');
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!a.isRead ? priorityDot[a.priority] : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!a.isRead ? 'font-semibold' : ''}`}>{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString()} · {a.createdByName}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] ml-1 flex-shrink-0">{a.type}</Badge>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t px-4 py-2">
            <button
              className="text-xs text-primary hover:underline w-full text-center"
              onClick={() => { setOpen(false); navigate('/announcements'); }}
            >
              View all announcements
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
