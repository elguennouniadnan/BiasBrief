// StoriesPageClient.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import { AuthProvider } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { trackEvents } from "@/lib/analytics"
import { SettingsDialog } from "@/components/settings-dialog"
import type { Article } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { articlesListCache, setArticlesListCache, getArticlesListCache } from "@/lib/article-list-cache"

function getArticlesListCacheKey({
  page,
  selectedCategory,
  searchQuery,
  articlesPerPage,
  sortOrder,
  customNewsEnabled,
  preferredCategories,
}: {
  page: number;
  selectedCategory: string;
  searchQuery: string;
  articlesPerPage: number;
  sortOrder: string;
  customNewsEnabled: boolean;
  preferredCategories: string[];
}) {
  return JSON.stringify({
    page,
    selectedCategory,
    searchQuery,
    articlesPerPage,
    sortOrder,
    customNewsEnabled,
    preferredCategories,
  });
}

interface StoriesPageClientProps {
  initialArticles: Article[];
  initialCategories: string[];
  initialTotalPages?: number;
  initialTotalCount?: number;
}

export default function StoriesPageClient({ initialArticles, initialCategories, initialTotalPages = 1, initialTotalCount = 0 }: StoriesPageClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [fontSize, setFontSize] = useState("medium")
  const [articlesPerPage, setArticlesPerPage] = useState(9)
  const [currentPage, setCurrentPage] = useState(1)
  const [allCategories, setAllCategories] = useState<string[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter();
  const searchParams = useSearchParams();

  // On mount, check for ?search= param and set searchQuery
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // --- ARTICLES LIST CACHE LOGIC ---
  // Compute cacheKey before any useEffect that uses it
  const cacheKey = useMemo(() => getArticlesListCacheKey({
    page: currentPage,
    selectedCategory,
    searchQuery,
    articlesPerPage,
    sortOrder: "new-to-old",
    customNewsEnabled: false,
    preferredCategories,
  }), [currentPage, selectedCategory, searchQuery, articlesPerPage, preferredCategories]);

  // On mount, restore articles list from cache if available and matches current filters/page
  // Also hydrate cache from localStorage if present and not expired (15min)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localCacheRaw = localStorage.getItem('articlesListCache');
    if (localCacheRaw) {
      try {
        // Parse as Record<string, any> to avoid type errors
        const localCache: Record<string, any> = JSON.parse(localCacheRaw);
        const now = Date.now();
        Object.entries(localCache).forEach(([key, entry]) => {
          if (
            entry &&
            typeof entry === 'object' &&
            typeof entry.timestamp === 'number' &&
            Array.isArray(entry.articles) &&
            typeof entry.page === 'number' &&
            typeof entry.totalPages === 'number' &&
            typeof entry.totalCount === 'number' &&
            typeof entry.filters === 'object' &&
            now - entry.timestamp < 15 * 60 * 1000
          ) {
            setArticlesListCache(key, entry);
          }
        });
      } catch {}
    }
  }, []);

  // Persist articlesListCache to localStorage on change (throttle to avoid spam)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = setTimeout(() => {
      localStorage.setItem('articlesListCache', JSON.stringify(articlesListCache));
    }, 500);
    return () => clearTimeout(handler);
  }, [articlesListCache]);

  // --- SECTION CATEGORIES CACHE LOGIC ---
  // Only fetch all categories/sections from /api/sections if not in localStorage or if cache is expired (1 day TTL)
  useEffect(() => {
    // If initialCategories is present and valid, use it and skip fetch
    if (Array.isArray(initialCategories) && initialCategories.length > 1) {
      setAllCategories(initialCategories);
      if (typeof window !== 'undefined') {
        localStorage.setItem('allCategoriesWithTimestamp', JSON.stringify({ categories: initialCategories, timestamp: Date.now() }));
      }
      return;
    }
    let didSet = false;
    async function fetchAllCategories() {
      let cached = null;
      let cacheTimestamp = 0;
      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('allCategoriesWithTimestamp');
          if (local) {
            const parsed = JSON.parse(local);
            cached = parsed.categories;
            cacheTimestamp = parsed.timestamp;
          }
        } catch {}
      }
      const now = Date.now();
      if (Array.isArray(cached) && cached.length > 0 && cacheTimestamp && (now - cacheTimestamp < 24 * 60 * 60 * 1000)) {
        setAllCategories(cached);
        didSet = true;
        return;
      }
      try {
        console.log('[CLIENT] Fetching /api/sections');
        const response = await fetch('/api/sections')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const categories = ['All', ...data.categories.filter((c: string) => c && c !== 'All')];
          setAllCategories(categories)
          didSet = true;
          if (typeof window !== 'undefined') {
            localStorage.setItem('allCategoriesWithTimestamp', JSON.stringify({ categories, timestamp: now }));
          }
        }
      } catch (e) {
        // ignore
      }
    }
    // Only fetch if not already set by SSR/props or if cache expired
    if (!allCategories || allCategories.length === 0 || (allCategories.length === 1 && allCategories[0] === 'All')) {
      fetchAllCategories();
    }
    // else, do nothing (already set)
  }, [initialCategories, allCategories])

  // --- ARTICLES FETCH/CACHE LOGIC ---
  useEffect(() => {
    // Only fetch if not in cache
    const cached = getArticlesListCache(cacheKey);
    if (cached) {
      setArticles(cached.articles);
      setTotalPages(cached.totalPages);
      setTotalCount(cached.totalCount);
      setIsLoading(false);
      return;
    }
    // Only fetch if we have a valid page and articlesPerPage
    if (!currentPage || !articlesPerPage) return;
    // If initialArticles is present and matches page 1, hydrate cache and use it
    if (initialArticles && initialArticles.length > 0 && currentPage === 1 && searchQuery === "" && selectedCategory === "All") {
      setArticles(initialArticles);
      setTotalPages(initialTotalPages);
      setTotalCount(initialTotalCount);
      setArticlesListCache(cacheKey, {
        articles: initialArticles,
        page: 1,
        totalPages: initialTotalPages,
        totalCount: initialTotalCount,
        filters: {
          searchQuery,
          selectedCategory,
          articlesPerPage,
          sortOrder: 'new-to-old',
          customNewsEnabled: false,
          preferredCategories: [...preferredCategories],
        },
        timestamp: Date.now(),
      });
      setIsLoading(false);
      return;
    }
    const fetchArticles = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (searchQuery) params.append('q', searchQuery)
        params.append('page', String(currentPage))
        params.append('pageSize', String(articlesPerPage))
        params.append('sortOrder', 'new-to-old')
        if (searchQuery) {
          // No preferredCategories/category param
        } else if (preferredCategories.length > 0 && (!selectedCategory || selectedCategory === 'All')) {
          params.append('preferredCategories', preferredCategories.join(','))
        } else if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory)
        }
        // Only fetch if page and pageSize are present in params
        if (!params.get('page') || !params.get('pageSize')) return;
        console.log('[CLIENT] Fetching /api/news', params.toString());
        const response = await fetch(`/api/news?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch articles')
        const data = await response.json()
        setArticles(data.articles)
        setTotalPages(data.totalPages || Math.max(1, Math.ceil(data.totalCount / articlesPerPage)))
        setTotalCount(data.totalCount || data.articles.length)
        setArticlesListCache(cacheKey, {
          articles: data.articles,
          page: currentPage,
          totalPages: data.totalPages || Math.max(1, Math.ceil(data.totalCount / articlesPerPage)),
          totalCount: data.totalCount || data.articles.length,
          filters: {
            searchQuery,
            selectedCategory,
            articlesPerPage,
            sortOrder: 'new-to-old',
            customNewsEnabled: false,
            preferredCategories: [...preferredCategories],
          },
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticles();
  }, [cacheKey, currentPage, articlesPerPage, initialArticles]);

  // If showBookmarksOnly is enabled, show only bookmarks in page-list format (no paging, all bookmarks)
  const bookmarksOnlyArticles = useMemo(() => {
    if (!showBookmarksOnly) return null;
    return articles.filter((article) => bookmarks.includes(article.id));
  }, [showBookmarksOnly, articles, bookmarks]);

  // Categories for filter and navbar
  const categories = allCategories

  // Restore toggleBookmark function
  const toggleBookmark = (articleId: string) => {
    setBookmarks((prev) => {
      if (prev.includes(articleId)) {
        return prev.filter((id) => id !== articleId)
      } else {
        return [...prev, articleId]
      }
    })
  }

  // Loading UI
  if (isLoading) {
    return (
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
          <Navbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showBookmarksOnly={showBookmarksOnly}
            setShowBookmarksOnly={setShowBookmarksOnly}
            preferredCategories={preferredCategories}
            setPreferredCategories={setPreferredCategories}
            themePreference={false}
            setThemePreference={() => {}}
            fontSize={fontSize}
            setFontSize={setFontSize}
            articlesPerPage={articlesPerPage}
            setArticlesPerPage={setArticlesPerPage}
            cardSize={3}
            setCardSize={() => {}}
            sortOrder={"new-to-old"}
            setSortOrder={() => {}}
            categories={categories}
            customNewsEnabled={false}
            setCustomNewsEnabled={() => {}}
            allCategories={categories}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg">Loading articles...</div>
          </div>
          <footer className="w-full mt-auto">
            {/* If you have a Footer component, use it here. Otherwise, add your footer content below. */}
          </footer>
        </div>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showBookmarksOnly={showBookmarksOnly}
          setShowBookmarksOnly={setShowBookmarksOnly}
          preferredCategories={preferredCategories}
          setPreferredCategories={setPreferredCategories}
          themePreference={false}
          setThemePreference={() => {}}
          fontSize={fontSize}
          setFontSize={setFontSize}
          articlesPerPage={articlesPerPage}
          setArticlesPerPage={setArticlesPerPage}
          cardSize={3}
          setCardSize={() => {}}
          sortOrder={"new-to-old"}
          setSortOrder={() => {}}
          categories={categories}
          customNewsEnabled={false}
          setCustomNewsEnabled={() => {}}
          allCategories={categories}
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentPage(1); // Always reset to page 1 on category change
          }}
        />
        <main className="flex-1 container mx-auto px-4 py-6">
          {searchQuery.trim() ? (
            <div className="flex items-center justify-between px-4 py-2">
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back to list
              </Button>
              <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[60vw] text-right">
                {`Search results for: "${searchQuery}"`}
              </span>
            </div>
          ) : null}
          {showBookmarksOnly ? (
            (bookmarksOnlyArticles && bookmarksOnlyArticles.length > 0) ? (
              <ArticleList
                articles={bookmarksOnlyArticles}
                isBookmarked={(id: string) => bookmarks.includes(id)}
                toggleBookmark={toggleBookmark}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-500 dark:text-gray-400 text-center max-w-xl">
                  You have not bookmarked any articles yet. To save articles for later, click the bookmark icon on any story.
                </div>
              </div>
            )
          ) : (
            <>
              <ArticleList
                articles={articles}
                isBookmarked={(id: string) => bookmarks.includes(id)}
                toggleBookmark={toggleBookmark}
              />
              {/* --- Page numbers UI always visible if totalPages > 1 and not in bookmarks mode --- */}
              {totalPages > 1 && !showBookmarksOnly && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AuthProvider>
  )
}
