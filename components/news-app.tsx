"use client"

import { useEffect, useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import { AuthProvider } from "@/lib/auth"
import { useTheme } from "next-themes"
import type { Article } from "@/lib/types"

export function NewsApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isBiasedMode, setIsBiasedMode] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [defaultBiasMode, setDefaultBiasMode] = useState(false)
  const [themePreference, setThemePreference] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [articlesPerPage, setArticlesPerPage] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [cardSize, setCardSize] = useState(3)
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old');
  
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Toggle bookmark status for an article
  const toggleBookmark = (articleId: number) => {
    const newBookmarks = bookmarks.includes(articleId)
      ? bookmarks.filter((id) => id !== articleId)
      : [...bookmarks, articleId]
    
    setBookmarks(newBookmarks)
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks))
  }

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
        localStorage.setItem("articles", JSON.stringify(data.articles))
        if (data.categories) {
          setCategories(data.categories)
        }
      }
      
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load user preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

      const savedThemePreference = localStorage.getItem("themePreference")
      if (savedThemePreference) {
        const isDark = savedThemePreference === "true"
        setThemePreference(isDark)
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

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      setTheme(themePreference ? "dark" : "light")
      localStorage.setItem("themePreference", themePreference.toString())
    }
  }, [themePreference, setTheme, mounted])

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
      const matchesPreferences = preferredCategories.length === 0 || preferredCategories.includes(article.category)
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
          setSearchQuery={setSearchQuery}
          isBiasedMode={isBiasedMode}
          setIsBiasedMode={setIsBiasedMode}
          showBookmarksOnly={showBookmarksOnly}
          setShowBookmarksOnly={setShowBookmarksOnly}
          preferredCategories={preferredCategories}
          setPreferredCategories={setPreferredCategories}
          defaultBiasMode={defaultBiasMode}
          setDefaultBiasMode={setDefaultBiasMode}
          themePreference={themePreference}
          setThemePreference={setThemePreference}
          fontSize={fontSize}
          setFontSize={setFontSize}
          articlesPerPage={articlesPerPage}
          setArticlesPerPage={setArticlesPerPage}
          cardSize={cardSize}
          setCardSize={setCardSize}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
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
                isBiasedMode={isBiasedMode}
                isBookmarked={(id: number) => bookmarks.includes(id)}
                toggleBookmark={toggleBookmark}
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
