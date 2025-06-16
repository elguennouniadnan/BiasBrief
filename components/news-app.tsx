"use client"

import { useEffect, useState, useMemo, useRef, use } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import { trackEvents } from "@/lib/analytics"
import { SettingsDialog } from "@/components/settings-dialog"
import type { Article } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { articlesListCache, setArticlesListCache, getArticlesListCache } from "@/lib/article-list-cache"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth"
import { usePreferences } from '@/hooks/use-preferences';

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

function NewsAppInner() {
  // Centralized theme logic (move this to the top)
  const { toggleTheme, theme, setTheme } = usePreferences();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [articlesPerPage, setArticlesPerPage] = useState(9)
  const [currentPage, setCurrentPage] = useState(1)
  const [mainFeedArticles, setMainFeedArticles] = useState<Article[]>([]);
  const [bookmarksArticles, setBookmarksArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"])
  const [allCategories, setAllCategories] = useState<string[]>(["All"])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [customNewsEnabled, setCustomNewsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("customNewsEnabled");
      if (saved !== null) return JSON.parse(saved);
    }
    return false;
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Add state to cache main feed articles when switching to bookmarks view
  const [mainFeedTotalPagesCache, setMainFeedTotalPagesCache] = useState<number | null>(null);
  const [mainFeedTotalCountCache, setMainFeedTotalCountCache] = useState<number | null>(null);
  const [mainFeedCurrentPageCache, setMainFeedCurrentPageCache] = useState<number | null>(null);
  const [mainFeedSelectedCategoryCache, setMainFeedSelectedCategoryCache] = useState<string | null>(null);

  const { user, setUser } = useAuth(); // destructure setUser if available

  // Sync user preferences from Firestore on sign-in (only once per session)
  const [themeInitialized, setThemeInitialized] = useState(false);
  useEffect(() => {
    if (!themeInitialized && user && user.preferences) {
      // Remove all theme logic from here, use usePreferences for theme state and handlers
      setThemeInitialized(true);
      // Articles per page
      if (user.preferences.articlesPerPage) setArticlesPerPage(user.preferences.articlesPerPage);
      // Preferred categories
      if (user.preferences.preferredCategories) setPreferredCategories(user.preferences.preferredCategories);
      // Bookmarks
      if (user.preferences.bookmarks) setBookmarks(user.preferences.bookmarks);
    }
  }, [user, setTheme, themeInitialized]);

  const toggleBookmark = (articleId: string) => {
    const newBookmarks = bookmarks.includes(articleId)
      ? bookmarks.filter((id) => id !== articleId)
      : [...bookmarks, articleId]
    
    setBookmarks(newBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks))

    //if bookmarks is empty, set showBookmarksOnly to false
    if (newBookmarks.length === 0) {
      setShowBookmarksOnly(false)
    }
    // Track bookmark toggle event
    trackEvents.bookmarkToggle(articleId, !bookmarks.includes(articleId))
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Always reset to page 1 when changing category
    if (typeof window !== 'undefined') {
      window.history.replaceState({
        ...(window.history.state || {}),
        lastPage: 1,
        lastCategory: category,
        lastCustomNewsEnabled: customNewsEnabled,
      }, '');
    }
    trackEvents.categorySelect(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      trackEvents.search(query);
    }
  };

  const handleBookmarkToggle = (articleId: string) => {
    const newIsBookmarked = !bookmarks.includes(articleId);
    toggleBookmark(articleId);
    trackEvents.bookmarkToggle(articleId, newIsBookmarked);
  };

  // Fetch main feed articles from API
  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      params.append('page', String(currentPage))
      params.append('pageSize', String(articlesPerPage))
      params.append('sortOrder', sortOrder)
      if (searchQuery) {
        // No preferredCategories/category param
        params.append('searchQuery', searchQuery)
      } else if (customNewsEnabled && preferredCategories.length > 0 ) {
        params.append('preferredCategories', preferredCategories.join(','))
      } else if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory)
      }
      const response = await fetch(`/api/news?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch articles')
      const data = await response.json()
      console.log('[FETCH] Articles:', data.articles.length, 'Total Count:', data.totalCount)
      setMainFeedArticles(data.articles)
      setTotalCount(data.totalCount)
      setTotalPages(Math.max(1, Math.ceil(data.totalCount / articlesPerPage)))

    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        setTheme(savedTheme)
      }

      const savedBookmarks = localStorage.getItem("bookmarks")
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks))
      }

      const savedPreferredCategories = localStorage.getItem("preferredCategories")
      if (savedPreferredCategories) {
        let parsed: unknown
        try {
          parsed = JSON.parse(savedPreferredCategories)
        } catch {
          parsed = []
        }
        if (Array.isArray(parsed) && parsed.every((c: unknown): c is string => typeof c === 'string')) {
          setPreferredCategories(parsed)
        }
      }

      const savedCustomNews = localStorage.getItem("customNewsEnabled")
      if (savedCustomNews !== null) {
        setCustomNewsEnabled(JSON.parse(savedCustomNews))
      }

      setMounted(true)
    }
  }, [])

  // --- ARTICLES LIST CACHE LOGIC ---
  // On mount, restore articles list from cache if available and matches current filters/page
  const cacheKey = getArticlesListCacheKey({
    page: currentPage,
    selectedCategory,
    searchQuery,
    articlesPerPage,
    sortOrder,
    customNewsEnabled,
    preferredCategories,
  });

  // On mount or when main feed filters/page change, restore or fetch main feed articles
  useEffect(() => {
    if (!mounted || showBookmarksOnly) return;
    const cache = getArticlesListCache(cacheKey);
    if (cache) {
      setMainFeedArticles(cache.articles);
      setTotalPages(cache.totalPages);
      setTotalCount(cache.totalCount);
      setIsLoading(false);
    } else {
      fetchArticles();
    }
  }, [mounted, cacheKey, showBookmarksOnly]);

  // After fetching main feed articles, update the cache
  useEffect(() => {
    if (!isLoading && mainFeedArticles.length > 0 && !showBookmarksOnly) {
      setArticlesListCache(cacheKey, {
        articles: mainFeedArticles,
        page: currentPage,
        totalPages,
        totalCount,
        filters: {
          searchQuery,
          selectedCategory,
          articlesPerPage,
          sortOrder,
          customNewsEnabled,
          preferredCategories: [...preferredCategories],
        },
        timestamp: Date.now(),
      });
    }
  }, [mainFeedArticles, isLoading, cacheKey, totalPages, totalCount, showBookmarksOnly]);

  // Prevent resetting to page 1 if restoring from history.state
  useEffect(() => {
    // Only reset to page 1 if NOT restoring from history.state
    if (
      typeof window !== 'undefined' &&
      (!window.history.state || !window.history.state.lastPage)
    ) {
      setCurrentPage(1);
    }
  }, [selectedCategory, showBookmarksOnly, preferredCategories, searchQuery])

  // Remove only obsolete localStorage keys
  useEffect(() => {
    if (mounted) {
      const keysToRemove = ["cardSize", "defaultBiasMode", "biasMode"]
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
      })
    }
  }, [mounted])

  // Sync preferredCategories from localStorage when customNewsEnabled is toggled on
  useEffect(() => {
    if (customNewsEnabled) {
      let stored: unknown = []
      if (typeof window !== 'undefined') {
        try {
          stored = JSON.parse(localStorage.getItem("preferredCategories") || "[]")
        } catch {
          stored = []
        }
      }
      if (Array.isArray(stored) && JSON.stringify(stored) !== JSON.stringify(preferredCategories)) {
        setPreferredCategories(stored)
      }
    }
  }, [customNewsEnabled])

  // Listen for changes to preferredCategories in localStorage when customNewsEnabled is on
  useEffect(() => {
    if (!customNewsEnabled) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "preferredCategories") {
        let stored: unknown = [];
        try {
          stored = JSON.parse(event.newValue || "[]");
        } catch {
          stored = [];
        }
        if (Array.isArray(stored) && JSON.stringify(stored) !== JSON.stringify(preferredCategories)) {
          if (Array.isArray(stored) && stored.every((item) => typeof item === 'string')) {
            if (Array.isArray(stored) && stored.every((item) => typeof item === 'string')) {
              setPreferredCategories(stored);
            }
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [customNewsEnabled, preferredCategories]);

  // Also, when customNewsEnabled is on, poll localStorage for changes (for same-tab updates)
  useEffect(() => {
    if (!customNewsEnabled) return;
    let last = JSON.stringify(preferredCategories);
    const interval = setInterval(() => {
      let stored: unknown = [];
      try {
        stored = JSON.parse(localStorage.getItem("preferredCategories") || "[]");
      } catch {
        stored = [];
      }
      const current = JSON.stringify(stored);
      if (current !== last) {
        if (Array.isArray(stored) && stored.every((item) => typeof item === 'string')) {
          setPreferredCategories(stored);
        }
        last = current;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [customNewsEnabled, preferredCategories]);

  // When showBookmarksOnly is enabled, use allArticles directly (already fetched from API by IDs)
  const allTabArticles = useMemo(() => {
    return mainFeedArticles.filter((article) => {
      const matchesCategory = selectedCategory === "All" || article.section === selectedCategory
      return matchesCategory
    })
  }, [mainFeedArticles, selectedCategory])

  // Always extract all categories from allArticles, not just preferred
  useEffect(() => {
    if (mainFeedArticles.length > 0) {
      const sections = ['All', ...Array.from(new Set(mainFeedArticles.map((a) => String(a.section || ''))))]
      setCategories(sections)
    }
  }, [mainFeedArticles])

  const customTabArticles = useMemo(() => {
    if (!preferredCategories.length) return []
    return mainFeedArticles.filter((article) => {
      const matchesPreferences = article.category && preferredCategories.includes(article.category)
      const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)
      return matchesPreferences && matchesBookmarks
    })
  }, [mainFeedArticles, preferredCategories, showBookmarksOnly, bookmarks])

  // New: fetch all categories/sections from /api/sections (1 doc read)
  useEffect(() => {
    async function fetchAllCategories() {
      let cached = null;
      if (typeof window !== 'undefined') {
        try {
          cached = JSON.parse(localStorage.getItem('allCategories') || 'null');
        } catch {}
      }
      if (Array.isArray(cached) && cached.length > 0) {
        setAllCategories(cached);
        return;
      }
      try {
        const response = await fetch('/api/sections')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const categories = ['All', ...data.categories.filter((c: string) => c && c !== 'All')];
          setAllCategories(categories)
          if (typeof window !== 'undefined') {
            localStorage.setItem('allCategories', JSON.stringify(categories));
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchAllCategories()
  }, [])

  // Calculate totalPages and totalCount based on bookmarks when showBookmarksOnly is enabled
  useEffect(() => {
    if (showBookmarksOnly) {
      const count = bookmarks.length;
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / articlesPerPage)));
      // If currentPage is out of range after bookmarks change, reset to 1
      if (currentPage > Math.ceil(count / articlesPerPage)) {
        setCurrentPage(1);
      }
    }
  }, [showBookmarksOnly, bookmarks, articlesPerPage]);

  // Remove bookmarksListCache and related logic
  // useEffect to fetch all bookmarked articles when showBookmarksOnly is enabled
  useEffect(() => {
    if (!showBookmarksOnly) return;
    // Always fetch all bookmarked articles from API
    const fetchAllBookmarkedArticles = async () => {
      if (bookmarks.length > 0) {
        try {
          const response = await fetch(`/api/news?ids=${bookmarks.join(',')}`);
          if (!response.ok) throw new Error('Failed to fetch bookmarked articles');
          const data = await response.json();
          setBookmarksArticles(data.articles);
        } catch (error) {
          setBookmarksArticles([]);
        }
      } else {
        setBookmarksArticles([]);
      }
    };
    fetchAllBookmarkedArticles();
  }, [showBookmarksOnly, bookmarks]);

  // On mount, restore selectedCategory and currentPage from history.state if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history.state) {
      const { lastCategory, lastPage } = window.history.state;
      if (lastCategory && lastCategory !== selectedCategory) {
        setSelectedCategory(lastCategory);
      }
      if (lastPage && lastPage !== currentPage) {
        setCurrentPage(lastPage);
      }
    }
  }, [mounted]);

  // When changing page, store lastPage, lastCategory, lastCustomNewsEnabled in history.state for restoration
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.history.replaceState({
        ...(window.history.state || {}),
        lastPage: page,
        lastCategory: selectedCategory,
        lastCustomNewsEnabled: customNewsEnabled,
      }, '');
    }
  };

  // Only show correct pagination for bookmarks or main feed
  const paginationTotalPages = showBookmarksOnly ? Math.max(1, Math.ceil(bookmarks.length / articlesPerPage)) : totalPages;

  // Always sync customNewsEnabled to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("customNewsEnabled", JSON.stringify(customNewsEnabled));
    }
  }, [customNewsEnabled]);

  // Fix: Remove updatePreferredCategories (use setPreferredCategories directly)
  // Fix: Define displayedArticles for rendering
  const displayedArticles = useMemo(() => {
    if (showBookmarksOnly) {
      // Show all bookmarked articles (no pagination)
      return bookmarksArticles;
    } else if (customNewsEnabled && (!selectedCategory || selectedCategory === 'All')) {
      return mainFeedArticles.filter((article) => {
        const matchesPreferences = article.category && preferredCategories.includes(article.category)
        const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)
        return matchesPreferences && matchesBookmarks
      });
    } else {
      return mainFeedArticles.filter((article) => {
        const matchesCategory = selectedCategory === "All" || article.section === selectedCategory
        return matchesCategory
      });
    }
  }, [showBookmarksOnly, bookmarksArticles, mainFeedArticles, customNewsEnabled, selectedCategory, preferredCategories, bookmarks]);

  // Handler to update unbiased title in the correct article list
  const handleUnbiasTitle = (id: string, unbiasedTitle: string) => {
    if (showBookmarksOnly) {
      setBookmarksArticles(articles => {
        const updated = articles.map(a => {
          if (a.id === id) {
            return { ...a, titleUnbiased: unbiasedTitle };
          }
          return a;
        });
        return updated;
      });
    } else {
      setMainFeedArticles(articles => {
        const updated = articles.map(a => {
          if (a.id === id) {
            return { ...a, titleUnbiased: unbiasedTitle };
          }
          return a;
        });
        return updated;
      });
    }
  };

  // Ensure category filter reverts to 'All' when custom news is enabled
  const prevCustomNewsEnabled = useRef(customNewsEnabled);
  useEffect(() => {
    if (!prevCustomNewsEnabled.current && customNewsEnabled) {
      console.log('[Custom News Enabled] Switching to All category');
      console.log('preferredCategories.length: ', preferredCategories.length);
      // Only switch to 'All' if preferredCategories is non-empty (prevents flash)
      if (preferredCategories.length > 0) {
        setSelectedCategory('All');
        // Force fetch for custom news
        fetchArticles();
      } else {
        // Wait for preferredCategories to update, then switch and fetch
        setTimeout(() => {
          if (preferredCategories.length > 0) {
            setSelectedCategory('All');
            fetchArticles();
          }
        }, 0);
      }
    }
    prevCustomNewsEnabled.current = customNewsEnabled;
  }, [customNewsEnabled, preferredCategories]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground mx-2">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showBookmarksOnly={showBookmarksOnly}
        setShowBookmarksOnly={setShowBookmarksOnly}
        preferredCategories={preferredCategories}
        setPreferredCategories={setPreferredCategories}
        articlesPerPage={articlesPerPage}
        setArticlesPerPage={setArticlesPerPage}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        categories={categories}
        customNewsEnabled={customNewsEnabled}
        setCustomNewsEnabled={setCustomNewsEnabled}
        allCategories={allCategories}
        theme={theme}
        toggleTheme={toggleTheme}
        setTheme={setTheme}
        isLoading={isLoading} // <-- Pass isLoading prop
      />

      <main className="flex-1 container px-1 py-2">
        {/* Show back button if search is active, otherwise show category filter */}
        {searchQuery.trim() ? (
          <div>
          </div>
        ) : showBookmarksOnly ? (
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xl font-semibold text-primary flex items-center gap-2">
              <span
                className="inline-block rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-300 bg-primary text-white border-primary shadow-sm"
              >
                Bookmarks
              </span>
            </span>
          </div>
        ) : (
          <CategoryFilter
            categories={allCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleCategoryChange}
          />
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {[...Array(articlesPerPage)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="h-48 w-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 flex flex-col p-4 gap-2">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedArticles.length > 0 ? (
          <>
            <ArticleList
              articles={displayedArticles}
              isBookmarked={(id: string) => bookmarks.includes(id)}
              toggleBookmark={handleBookmarkToggle}
              onUnbiasTitle={(id, unbiasedTitle) => {
                handleUnbiasTitle(id, unbiasedTitle);
                // Log displayedArticles after update attempt
                setTimeout(() => {
                  console.log('[ArticleList onUnbiasTitle] displayedArticles after update:', displayedArticles);
                }, 500);
              }}
            />
            {/* Only show pagination if not in bookmarks view */}
            {!showBookmarksOnly && totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginationTotalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : customNewsEnabled && preferredCategories.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-center max-w-xl">
              To view custom news, please set your preferred categories in the settings. Once you have selected your preferences, relevant articles will appear here.
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">No articles found</div>
          </div>
        )}
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        categories={allCategories} // Use the canonical categories list
        preferredCategories={preferredCategories}
        setPreferredCategories={setPreferredCategories}
        articlesPerPage={articlesPerPage}
        setArticlesPerPage={setArticlesPerPage}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
    </div>
  )
}

export function NewsAppWrapper(props: any) {
  const { AuthProvider } = require("@/lib/auth");
  return (
    <AuthProvider>
      <NewsAppInner {...props} />
    </AuthProvider>
  );
}

// For backwards compatibility, also export as default
export default NewsAppWrapper;
