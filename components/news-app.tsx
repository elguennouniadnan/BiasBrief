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

export function NewsApp() {
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
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [defaultBiasMode, setDefaultBiasMode] = useState(false)
  const [fontSize, setFontSize] = useState("small") // default to small
  const [articlesPerPage, setArticlesPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [cardSize, setCardSize] = useState(3)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [allCategories, setAllCategories] = useState<string[]>(["All"])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [customNewsEnabled, setCustomNewsEnabled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const toggleBookmark = (articleId: number) => {
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
    trackEvents.categorySelect(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      trackEvents.search(query);
    }
  };

  const handleBookmarkToggle = (articleId: number) => {
    const newIsBookmarked = !bookmarks.includes(articleId);
    toggleBookmark(articleId);
    trackEvents.bookmarkToggle(articleId, newIsBookmarked);
  };

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      params.append('page', String(currentPage))
      params.append('pageSize', String(articlesPerPage))
      params.append('sortOrder', sortOrder)
      // If searching, do NOT filter by preferredCategories, search all articles
      if (searchQuery) {
        // No preferredCategories/category param
      } else if (customNewsEnabled && preferredCategories.length > 0 && (!selectedCategory || selectedCategory === 'All')) {
        params.append('preferredCategories', preferredCategories.join(','))
      } else if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory)
      }
      const response = await fetch(`/api/news?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch articles')
      const data = await response.json()
      setAllArticles(data.articles)
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
      const biasMode = localStorage.getItem("biasMode") === "true"
      if (biasMode !== null) {
        setIsBiasedMode(biasMode)
      }

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

  useEffect(() => {
    if (mounted) {
      fetchArticles()
    }
  }, [mounted, searchQuery, currentPage, articlesPerPage, sortOrder, selectedCategory, customNewsEnabled, preferredCategories])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
    }
  }, [bookmarks, mounted])

  useEffect(() => {
    if (mounted && preferredCategories.length > 0) {
      localStorage.setItem("preferredCategories", JSON.stringify(preferredCategories))
    }
  }, [preferredCategories, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("customNewsEnabled", JSON.stringify(customNewsEnabled))
    }
  }, [customNewsEnabled, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("fontSize", fontSize)
    }
  }, [fontSize, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("articlesPerPage", articlesPerPage.toString())
    }
  }, [articlesPerPage, mounted])

  useEffect(() => {
    setCurrentPage(1)
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
    if (showBookmarksOnly) {
      return allArticles
    }
    return allArticles.filter((article) => {
      const matchesCategory = selectedCategory === "All" || article.section === selectedCategory
      return matchesCategory
    })
  }, [allArticles, selectedCategory, showBookmarksOnly])

  // Always extract all categories from allArticles, not just preferred
  useEffect(() => {
    if (allArticles.length > 0) {
      const sections = ['All', ...Array.from(new Set(allArticles.map((a) => String(a.section || ''))))]
      setCategories(sections)
    }
  }, [allArticles])

  const customTabArticles = useMemo(() => {
    if (!preferredCategories.length) return []
    return allArticles.filter((article) => {
      const matchesPreferences = article.category && preferredCategories.includes(article.category)
      const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)
      return matchesPreferences && matchesBookmarks
    })
  }, [allArticles, preferredCategories, showBookmarksOnly, bookmarks])

  useEffect(() => {
    if (mounted) {
      const fontSizes = {
        small: "0.925rem",
        medium: "1rem",
        large: "1.125rem"
      }
      document.documentElement.style.fontSize = fontSizes[fontSize as keyof typeof fontSizes] || "1rem"
    }
  }, [fontSize, mounted])

  // New: fetch all categories/sections from /api/sections (1 doc read)
  useEffect(() => {
    async function fetchAllCategories() {
      try {
        const response = await fetch('/api/sections')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setAllCategories(['All', ...data.categories.filter((c: string) => c && c !== 'All')])
        }
      } catch (e) {
        // ignore
      }
    }
    fetchAllCategories()
  }, [])

  // Calculate totalPages based on filtered articles when showing bookmarks only
  useEffect(() => {
    if (showBookmarksOnly) {
      const count = allTabArticles.length
      setTotalPages(Math.max(1, Math.ceil(count / articlesPerPage)))
    }
  }, [showBookmarksOnly, allTabArticles, articlesPerPage])

  // Fetch articles by IDs from API when showBookmarksOnly is enabled
  useEffect(() => {
    if (!showBookmarksOnly) return; // Only run when showBookmarksOnly is true
    const fetchBookmarkedArticles = async () => {
      if (bookmarks.length > 0) {
        try {
          const response = await fetch(`/api/news?ids=${bookmarks.join(',')}`)
          if (!response.ok) throw new Error('Failed to fetch bookmarked articles')
          const data = await response.json()
          setAllArticles(data.articles)
          setTotalCount(data.totalCount)
          setTotalPages(Math.max(1, Math.ceil(data.totalCount / articlesPerPage)))
        } catch (error) {
          setAllArticles([])
          setTotalCount(0)
          setTotalPages(1)
        }
      }
    }
    fetchBookmarkedArticles()
  }, [showBookmarksOnly, bookmarks, articlesPerPage])

  // Cache for main feed state
  const [cachedArticles, setCachedArticles] = useState<Article[] | null>(null)
  const [cachedSelectedCategory, setCachedSelectedCategory] = useState<string | null>(null)
  const [cachedCurrentPage, setCachedCurrentPage] = useState<number | null>(null)

  // When showBookmarksOnly is toggled, cache or restore state
  useEffect(() => {
    if (showBookmarksOnly) {
      // Cache current state before switching to bookmarks
      setCachedArticles(allArticles)
      setCachedSelectedCategory(selectedCategory)
      setCachedCurrentPage(currentPage)
    } else if (cachedArticles && cachedSelectedCategory !== null && cachedCurrentPage !== null) {
      // Restore previous state
      setAllArticles(cachedArticles)
      setSelectedCategory(cachedSelectedCategory)
      setCurrentPage(cachedCurrentPage)
      setCachedArticles(null)
      setCachedSelectedCategory(null)
      setCachedCurrentPage(null)
    }
  }, [showBookmarksOnly])

  // When showBookmarksOnly is turned off, reset to 'All' tab and page 1 (only on transition)
  // const prevShowBookmarksOnly = useRef(showBookmarksOnly)
  // useEffect(() => {
  //   if (prevShowBookmarksOnly.current && !showBookmarksOnly) {
  //     setSelectedCategory('All');
  //     setCurrentPage(1);
  //   }
  //   prevShowBookmarksOnly.current = showBookmarksOnly;
  // }, [showBookmarksOnly]);

  // When showBookmarksOnly is enabled, use allArticles directly (already fetched from API by IDs)
  // When customNewsEnabled and not showing bookmarks, use customTabArticles
  // Otherwise, use allTabArticles
  const displayedArticles = useMemo(() => {
    if (showBookmarksOnly) {
      return allArticles
    } else if (customNewsEnabled && (!selectedCategory || selectedCategory === 'All')) {
      return customTabArticles
    } else {
      return allTabArticles
    }
  }, [showBookmarksOnly, allArticles, customNewsEnabled, customTabArticles, allTabArticles, selectedCategory])

  // Custom: Only update preferredCategories in localStorage, do not reload or update state here
  const updatePreferredCategories = (newCategories: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("preferredCategories", JSON.stringify(newCategories))
    }
    // Do not update state or reload articles here
  }

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground mx-2">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={handleSearch}
          showBookmarksOnly={showBookmarksOnly}
          setShowBookmarksOnly={setShowBookmarksOnly}
          preferredCategories={preferredCategories}
          setPreferredCategories={updatePreferredCategories}
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

        <main className="flex-1 container px-1 py-6">
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
                isBookmarked={(id: number) => bookmarks.includes(id)}
                toggleBookmark={handleBookmarkToggle}
                cardSize={cardSize}
              />
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
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
          setPreferredCategories={updatePreferredCategories}
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
