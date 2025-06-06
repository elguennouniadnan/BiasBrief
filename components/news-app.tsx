"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import { AuthProvider } from "@/lib/auth"
import { useTheme } from "next-themes"
import { trackEvents } from "@/lib/analytics"
import { SettingsDialog } from "@/components/settings-dialog"
import type { Article } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { articlesListCache, setArticlesListCache, getArticlesListCache } from "@/lib/article-list-cache"
import { useRouter } from "next/navigation"

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

export function NewsApp() {
  const router = useRouter();
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme")
      return savedTheme ? savedTheme === 'dark' : theme === 'dark'
    }
    return false
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setThemePreference(theme === 'dark')
    }
  }, [theme, mounted])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isBiasedMode, setIsBiasedMode] = useState(false)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [defaultBiasMode, setDefaultBiasMode] = useState(false)
  const [fontSize, setFontSize] = useState("small") // default to small
  const [articlesPerPage, setArticlesPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [cardSize, setCardSize] = useState(3)
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

  // --- FRONT PAGE ARTICLES CACHE LOGIC ---
  const FRONT_PAGE_CACHE_KEY = 'frontPageArticlesCache';
  const FRONT_PAGE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  const frontPageArticlesCacheRef = useRef<Record<string, { articles: Article[]; timestamp: number }>>({});

  // Hydrate in-memory cache from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(FRONT_PAGE_CACHE_KEY);
      if (raw) {
        try {
          frontPageArticlesCacheRef.current = JSON.parse(raw);
        } catch {}
      }
    }
  }, []);

  // Persist in-memory cache to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FRONT_PAGE_CACHE_KEY, JSON.stringify(frontPageArticlesCacheRef.current));
    }
  }, [mainFeedArticles, selectedCategory]);

  // Fetch front-page articles by category with 30min cache
  const fetchFrontPageArticles = async (category: string) => {
    setIsLoading(true);
    const now = Date.now();
    const cacheEntry = frontPageArticlesCacheRef.current[category];
    if (cacheEntry && now - cacheEntry.timestamp < FRONT_PAGE_CACHE_TTL) {
      setMainFeedArticles(cacheEntry.articles);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/front-page-articles?section=${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error('Failed to fetch front page articles');
      const data = await response.json();
      // Always expect data.articles to be an array
      setMainFeedArticles(Array.isArray(data.articles) ? data.articles : []);
      frontPageArticlesCacheRef.current[category] = { articles: Array.isArray(data.articles) ? data.articles : [], timestamp: now };
      // Persist immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(FRONT_PAGE_CACHE_KEY, JSON.stringify(frontPageArticlesCacheRef.current));
      }
    } catch (error) {
      setMainFeedArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Replace fetchArticles logic for front page (no search, no bookmarks)
  useEffect(() => {
    if (!mounted || showBookmarksOnly || searchQuery.trim()) return;
    fetchFrontPageArticles(selectedCategory);
  }, [mounted, selectedCategory, showBookmarksOnly, searchQuery]);

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

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground mx-2">
        <div className="container px-1 sm:px-4 md:px-6 lg:px-8 w-full max-w-screen-2xl mx-auto">
          <Navbar
            searchQuery={searchQuery}
            setSearchQuery={handleSearch}
            showBookmarksOnly={showBookmarksOnly}
            setShowBookmarksOnly={setShowBookmarksOnly}
            preferredCategories={preferredCategories}
            setPreferredCategories={setPreferredCategories}
            themePreference={themePreference}
            setThemePreference={(isDark) => {
              setTheme(isDark ? "dark" : "light");
              trackEvents.toggleTheme(isDark ? 'dark' : 'light');
            }}
            fontSize={fontSize}
            setFontSize={setFontSize}
            articlesPerPage={articlesPerPage}
            setArticlesPerPage={setArticlesPerPage}
            cardSize={cardSize}
            setCardSize={setCardSize}
            sortOrder={sortOrder}
            setSortOrder={(order) => {
              setSortOrder(order);
              trackEvents.sortOrderChange(order);
            }}
            categories={categories}
            customNewsEnabled={customNewsEnabled}
            setCustomNewsEnabled={setCustomNewsEnabled}
            allCategories={allCategories}
          />
        </div>

        <main className="flex-1 container px-1 py-2">
          {/* Show back button if search is active, otherwise show category filter */}
          {searchQuery.trim() ? (
            <div className="flex items-center justify-between px-4 py-2">
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className=" hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back to list
              </Button>
              <span className=" text-gray-600 dark:text-gray-300 font-medium truncate max-w-[60vw] text-right">
                  Search results for: "{searchQuery}"
              </span>
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
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading articles...</div>
            </div>
          ) : displayedArticles.length > 0 ? (
            <>
              <ArticleList
                articles={displayedArticles}
                isBookmarked={(id: string) => bookmarks.includes(id)}
                toggleBookmark={handleBookmarkToggle}
                cardSize={cardSize}
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
          themePreference={themePreference}
          setThemePreference={setThemePreference}
          articlesPerPage={articlesPerPage}
          setArticlesPerPage={setArticlesPerPage}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      </div>
    </AuthProvider>
  )
}
