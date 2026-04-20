import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Tag,
  Loader2,
  CircleHelp,
} from 'lucide-react';
import { helpApi } from '@/services/helpService';
import type { HelpArticle, HelpCategory } from '@/types/help';

type View = 'home' | 'category' | 'article';

const Help = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const slugParam = searchParams.get('article');
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  const view: View = slugParam ? 'article' : categoryParam ? 'category' : 'home';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync search to URL
  useEffect(() => {
    if (debouncedSearch && view === 'home') {
      setSearchParams({ q: debouncedSearch });
    } else if (!debouncedSearch && searchParam) {
      setSearchParams({});
    }
  }, [debouncedSearch]);

  // Categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['help-categories'],
    queryFn: helpApi.getCategories,
  });

  // Articles list (search or category filter)
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['help-articles', debouncedSearch, categoryParam],
    queryFn: () =>
      helpApi.getArticles({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(categoryParam ? { category: categoryParam } : {}),
        limit: 50,
      }),
    enabled: view !== 'article',
  });

  // Single article
  const { data: articleData, isLoading: articleLoading } = useQuery({
    queryKey: ['help-article', slugParam],
    queryFn: () => helpApi.getArticleBySlug(slugParam!),
    enabled: !!slugParam,
  });

  const categories = categoriesData?.data || [];
  const articles = articlesData?.data || [];
  const article = articleData?.data;

  const selectedCategory = categoryParam
    ? categories.find((c) => c.slug === categoryParam)
    : null;

  const goHome = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const goToCategory = (slug: string) => {
    setSearchQuery('');
    setSearchParams({ category: slug });
  };

  const goToArticle = (slug: string) => {
    setSearchParams({ article: slug });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {view !== 'home' && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2"
              onClick={() => {
                if (view === 'article' && categoryParam) {
                  setSearchParams({ category: categoryParam });
                } else {
                  goHome();
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

          {view === 'home' && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <CircleHelp className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Find guides & how-to articles for every feature in CampusWise
              </p>
            </>
          )}

          {view === 'category' && selectedCategory && (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{selectedCategory.name}</h1>
              <p className="text-muted-foreground mt-1">{selectedCategory.description}</p>
            </>
          )}

          {view === 'article' && article && (
            <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
          )}
        </div>

        {/* Search — on home and category views */}
        {view !== 'article' && (
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        )}

        {/* ─── HOME VIEW ───────────────────────────────────── */}
        {view === 'home' && !debouncedSearch && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-5 animate-pulse h-32" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => goToCategory(cat.slug)}
                    className="rounded-lg border bg-card p-5 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                    {cat.articleCount != null && (
                      <p className="text-xs text-muted-foreground/70 mt-2">{cat.articleCount} articles</p>
                    )}
                  </button>
                ))}
          </div>
        )}

        {/* ─── SEARCH RESULTS / CATEGORY ARTICLES ─────────── */}
        {(view === 'category' || (view === 'home' && debouncedSearch)) && (
          <div>
            {articlesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CircleHelp className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">No articles found</p>
                <p className="text-sm mt-1">Try a different search term or browse categories</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => goToArticle(a.slug)}
                    className="w-full rounded-lg border bg-card p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{a.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>
                        {a.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {a.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-3" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ARTICLE DETAIL VIEW ────────────────────────── */}
        {view === 'article' && (
          <div>
            {articleLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !article ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">Article not found</p>
                <Button variant="outline" className="mt-4" onClick={goHome}>
                  Back to Help Center
                </Button>
              </div>
            ) : (
              <div>
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 mb-6 text-xs text-muted-foreground">
                  {article.tags?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {article.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {article.roles?.length > 0 && article.roles.length < 7 && (
                    <div className="flex items-center gap-1">
                      <span>For:</span>
                      {article.roles.map((r) => (
                        <Badge key={r} variant="outline" className="text-[10px] capitalize">
                          {r.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Steps */}
                {article.steps?.length > 0 && (
                  <div className="mb-8 p-4 rounded-lg border bg-muted/30">
                    <h3 className="font-semibold text-sm mb-3">Quick Steps</h3>
                    <ol className="space-y-2">
                      {article.steps.map((step) => (
                        <li key={step.stepNumber} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {step.stepNumber}
                          </span>
                          <div>
                            <span className="font-medium">{step.title}</span>
                            {step.description && (
                              <span className="text-muted-foreground"> — {step.description}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Markdown Content */}
                <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-relaxed prose-li:leading-relaxed prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.content}
                  </ReactMarkdown>
                </article>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Help;
