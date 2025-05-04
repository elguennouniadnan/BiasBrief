import { track } from '@vercel/analytics';

export const trackEvents = {
  articleView: (articleId: number, title: string) => {
    track('article_view', { articleId, title });
  },
  toggleBiasMode: (isBiased: boolean) => {
    track('toggle_bias_mode', { isBiased });
  },
  categorySelect: (category: string) => {
    track('category_select', { category });
  },
  bookmarkToggle: (articleId: number, isBookmarked: boolean) => {
    track('bookmark_toggle', { articleId, isBookmarked });
  },
  search: (query: string) => {
    track('search', { query });
  },
  themeChange: (theme: string) => {
    track('theme_change', { theme });
  },
  sortOrderChange: (order: 'new-to-old' | 'old-to-new') => {
    track('sort_order_change', { order });
  },
  share: (method: 'native' | 'clipboard' | 'manual', articleId: number) => {
    track('share', { method, articleId });
  }
};