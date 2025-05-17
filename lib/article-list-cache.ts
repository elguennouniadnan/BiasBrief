// Simple in-memory cache for the articles list (singleton, per session)
// This cache is shared across the client and avoids duplicates.
// Use this for the main articles list (not for individual articles)

import type { Article } from "@/lib/types";

export type ArticlesListCacheEntry = {
  articles: Article[];
  page: number;
  totalPages: number;
  totalCount: number;
  filters: Record<string, any>;
  timestamp: number;
};

// Only one cache variable for the articles list
export let articlesListCache: Record<string, ArticlesListCacheEntry> = {};

export function setArticlesListCache(key: string, cache: ArticlesListCacheEntry) {
  articlesListCache[key] = cache;
}
export function getArticlesListCache(key: string) {
  return articlesListCache[key] || null;
}
export function clearArticlesListCache() {
  articlesListCache = {};
}
