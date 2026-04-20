import api from '@/lib/api';
import type {
  HelpCategoriesResponse,
  HelpArticlesResponse,
  HelpArticleResponse,
} from '@/types/help';

export const helpApi = {
  getCategories: async (): Promise<HelpCategoriesResponse> => {
    const response = await api.get('/help/categories');
    return response.data;
  },

  getArticles: async (params?: Record<string, any>): Promise<HelpArticlesResponse> => {
    const response = await api.get('/help/articles', { params });
    return response.data;
  },

  getArticleBySlug: async (slug: string): Promise<HelpArticleResponse> => {
    const response = await api.get(`/help/articles/${slug}`);
    return response.data;
  },

  getContextualHelp: async (route: string): Promise<HelpArticlesResponse> => {
    const response = await api.get('/help/contextual', { params: { route } });
    return response.data;
  },

  searchArticles: async (query: string): Promise<HelpArticlesResponse> => {
    const response = await api.get('/help/articles', { params: { search: query, limit: 20 } });
    return response.data;
  },
};
