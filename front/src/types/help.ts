export interface HelpCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  featureKey: string | null;
  order: number;
  status: 'active' | 'inactive';
  articleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HelpStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface HelpScreenshot {
  url: string;
  caption: string;
  altText: string;
}

export interface HelpArticle {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: HelpCategory | string;
  module: string | null;
  featureKey: string | null;
  roles: string[];
  tags: string[];
  relatedRoutes: string[];
  steps: HelpStep[];
  screenshots: HelpScreenshot[];
  order: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface HelpArticlesResponse {
  success: boolean;
  data: HelpArticle[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HelpCategoriesResponse {
  success: boolean;
  data: HelpCategory[];
}

export interface HelpArticleResponse {
  success: boolean;
  data: HelpArticle;
}
