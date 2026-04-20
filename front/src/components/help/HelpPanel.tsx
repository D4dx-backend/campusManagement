import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  ArrowLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { helpApi } from '@/services/helpService';
import type { HelpArticle } from '@/types/help';

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpPanel = ({ open, onOpenChange }: HelpPanelProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset state when panel opens
  useEffect(() => {
    if (open) {
      setSelectedArticle(null);
      setSearchQuery('');
      setDebouncedSearch('');
    }
  }, [open]);

  // Contextual articles for current route
  const { data: contextualData, isLoading: contextualLoading } = useQuery({
    queryKey: ['help-contextual', location.pathname],
    queryFn: () => helpApi.getContextualHelp(location.pathname),
    enabled: open && !debouncedSearch && !selectedArticle,
  });

  // Search results
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['help-search-panel', debouncedSearch],
    queryFn: () => helpApi.searchArticles(debouncedSearch),
    enabled: open && !!debouncedSearch && !selectedArticle,
  });

  const contextualArticles = contextualData?.data || [];
  const searchResults = searchData?.data || [];
  const displayArticles = debouncedSearch ? searchResults : contextualArticles;
  const isLoading = debouncedSearch ? searchLoading : contextualLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          {selectedArticle ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 -ml-1"
                onClick={() => setSelectedArticle(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <SheetTitle className="text-base truncate">{selectedArticle.title}</SheetTitle>
            </div>
          ) : (
            <>
              <SheetTitle>Help</SheetTitle>
              <SheetDescription className="sr-only">Search help articles or view contextual help for this page</SheetDescription>
            </>
          )}
        </SheetHeader>

        {!selectedArticle && (
          <div className="px-5 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          {/* Article detail view */}
          {selectedArticle ? (
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground mb-4">{selectedArticle.summary}</p>

              {selectedArticle.steps?.length > 0 && (
                <div className="mb-5 p-3 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold text-xs mb-2">Quick Steps</h4>
                  <ol className="space-y-1.5">
                    {selectedArticle.steps.map((step) => (
                      <li key={step.stepNumber} className="flex gap-2 text-xs">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <span className="font-medium pt-0.5">{step.title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-sm prose-p:text-xs prose-p:leading-relaxed prose-li:text-xs prose-li:leading-relaxed prose-table:text-xs prose-code:text-[10px] prose-pre:text-[10px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArticle.content}
                </ReactMarkdown>
              </article>

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/help?article=${selectedArticle.slug}`);
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  Open in Help Center
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-3">
              {!debouncedSearch && contextualArticles.length > 0 && (
                <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-wide mb-2">
                  HELP FOR THIS PAGE
                </p>
              )}
              {debouncedSearch && searchResults.length > 0 && (
                <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-wide mb-2">
                  SEARCH RESULTS
                </p>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : displayArticles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm font-medium">
                    {debouncedSearch ? 'No results found' : 'No help articles for this page'}
                  </p>
                  <p className="text-xs mt-1">Try searching or visit the full Help Center</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/help');
                    }}
                  >
                    Open Help Center
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayArticles.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => setSelectedArticle(a)}
                      className="w-full rounded-lg border bg-card p-3 text-left hover:border-primary/40 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                            {a.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.summary}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Link to full help center */}
              {!debouncedSearch && (
                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/help');
                    }}
                  >
                    Browse all help articles
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
