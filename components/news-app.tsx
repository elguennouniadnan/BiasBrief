"use client"

import { useEffect, useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import { AuthProvider } from "@/lib/auth"
import { useTheme } from "next-themes"
import { trackEvents } from "@/lib/analytics"
import type { Article } from "@/lib/types"

export function NewsApp() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [themePreference, setThemePreference] = useState(() => {
    // Initialize with system preference if no theme is set
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme")
      return savedTheme ? savedTheme === 'dark' : theme === 'dark'
    }
    return false
  })

  // Effect to handle mounting state and theme sync
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update themePreference when theme changes
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
  const [fontSize, setFontSize] = useState("medium")
  const [articlesPerPage, setArticlesPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [cardSize, setCardSize] = useState(3)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old');

  // Toggle bookmark status for an article
  const toggleBookmark = (articleId: number) => {
    const newBookmarks = bookmarks.includes(articleId)
      ? bookmarks.filter((id) => id !== articleId)
      : [...bookmarks, articleId]
    
    setBookmarks(newBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks))
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    trackEvents.categorySelect(category);
  };

  const handleBiasModeToggle = (biased: boolean) => {
    setIsBiasedMode(biased);
    trackEvents.toggleBiasMode(biased);
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

  // Fetch all articles from our API
  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      
      if (searchQuery) {
        params.append('q', searchQuery)
      }
      
      console.log('Fetching articles with params:', params.toString())
      const response = await fetch(`/api/news?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles')
      }
      
      const data = await response.json()
      console.log("API response:", data)
      
      if (data.articles) {
        setAllArticles(data.articles)
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories)
        } else {
          const sections = ['All', ...Array.from(new Set(data.articles.map(a => a.section)))]
          setCategories(sections)
        }
      }
      
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load of preferences from localStorage
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
        setPreferredCategories(JSON.parse(savedPreferredCategories))
      }

      const savedDefaultBiasMode = localStorage.getItem("defaultBiasMode")
      if (savedDefaultBiasMode) {
        const biasMode = savedDefaultBiasMode === "true"
        setDefaultBiasMode(biasMode)
        setIsBiasedMode(biasMode)
      }

      const savedFontSize = localStorage.getItem("fontSize")
      if (savedFontSize) {
        setFontSize(savedFontSize)
      }

      const savedArticlesPerPage = localStorage.getItem("articlesPerPage")
      if (savedArticlesPerPage) {
        setArticlesPerPage(Number(savedArticlesPerPage))
      }

      const savedCardSize = localStorage.getItem("cardSize")
      if (savedCardSize) {
        setCardSize(parseInt(savedCardSize))
      }

      setMounted(true)
    }
  }, [])

  // Fetch articles when component mounts or when search query changes
  useEffect(() => {
    if (mounted && (!localStorage.getItem("articles") || searchQuery)) {
      fetchArticles()
    } else if (mounted && localStorage.getItem("articles")) {
      const savedArticles = JSON.parse(localStorage.getItem("articles") || "[]") as Article[]
      setAllArticles(savedArticles)
      
      // Set categories from saved articles
      const sections = ['All', ...Array.from(new Set(savedArticles.map(a => a.section)))]
      setCategories(sections)
      
      setIsLoading(false)
    }
  }, [mounted, searchQuery])

  // Save preferences to localStorage
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
      localStorage.setItem("defaultBiasMode", defaultBiasMode.toString())
    }
  }, [defaultBiasMode, mounted])

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
    if (mounted) {
      localStorage.setItem("cardSize", cardSize.toString())
    }
  }, [cardSize, mounted])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, showBookmarksOnly, preferredCategories])

  // Filter and paginate articles
  const { filteredArticles, totalPages } = useMemo(() => {
    // Apply all filters
    let filtered = allArticles.filter((article) => {
      const matchesCategory = selectedCategory === "All" || article.section === selectedCategory
      const matchesPreferences = preferredCategories.length === 0 || 
        (article.category && preferredCategories.includes(article.category))
      const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)
      return matchesCategory && matchesPreferences && matchesBookmarks
    });

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'new-to-old' ? dateB - dateA : dateA - dateB;
    });

    // Calculate pagination
    const total = Math.ceil(filtered.length / articlesPerPage)
    const start = (currentPage - 1) * articlesPerPage
    const end = start + articlesPerPage
    const paginatedArticles = filtered.slice(start, end)

    return {
      filteredArticles: paginatedArticles,
      totalPages: total
    }
  }, [allArticles, selectedCategory, preferredCategories, showBookmarksOnly, bookmarks, currentPage, articlesPerPage, sortOrder]);

  // Apply font size to document root
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

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={handleSearch}
          isBiasedMode={isBiasedMode}
          setIsBiasedMode={handleBiasModeToggle}
          showBookmarksOnly={showBookmarksOnly}
          setShowBookmarksOnly={setShowBookmarksOnly}
          preferredCategories={preferredCategories}
          setPreferredCategories={setPreferredCategories}
          defaultBiasMode={defaultBiasMode}
          setDefaultBiasMode={setDefaultBiasMode}
          themePreference={themePreference}
          setThemePreference={(isDark) => {
            setTheme(isDark ? "dark" : "light");
            // Using the toggleTheme method which exists in the trackEvents API
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
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
        />
        <main className="flex-1 container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading articles...</div>
            </div>
          ) : filteredArticles.length > 0 ? (
            <>
              <ArticleList
                articles={filteredArticles}
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
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">No articles found</div>
            </div>
          )}
        </main>
      </div>
    </AuthProvider>
  )
}
