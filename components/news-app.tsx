"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import { mockArticles } from "@/lib/mock-data"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"

export function NewsApp() {
  const [articles, setArticles] = useState(mockArticles)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isBiasedMode, setIsBiasedMode] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [defaultBiasMode, setDefaultBiasMode] = useState(false)
  const [defaultDarkMode, setDefaultDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [articlesPerPage, setArticlesPerPage] = useState(9)
  const [currentPage, setCurrentPage] = useState(1)

  // Load bookmarks from localStorage on initial render
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarks")
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))
    }
  }, [])

  // Save bookmarks to localStorage when they change
  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  }, [bookmarks])

  // Toggle bookmark status for an article
  const toggleBookmark = (articleId: number) => {
    setBookmarks((prev) => {
      if (prev.includes(articleId)) {
        return prev.filter((id) => id !== articleId)
      } else {
        return [...prev, articleId]
      }
    })
  }

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferredCategories = localStorage.getItem("preferredCategories")
    if (savedPreferredCategories) {
      setPreferredCategories(JSON.parse(savedPreferredCategories))
    } else {
      // Default to all categories if not set
      setPreferredCategories(Array.from(new Set(articles.map((article) => article.category))))
    }

    const savedDefaultBiasMode = localStorage.getItem("defaultBiasMode")
    if (savedDefaultBiasMode) {
      const biasMode = savedDefaultBiasMode === "true"
      setDefaultBiasMode(biasMode)
      setIsBiasedMode(biasMode)
    }

    const savedDefaultDarkMode = localStorage.getItem("defaultDarkMode")
    if (savedDefaultDarkMode) {
      setDefaultDarkMode(savedDefaultDarkMode === "true")
    }

    const savedFontSize = localStorage.getItem("fontSize")
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }

    const savedArticlesPerPage = localStorage.getItem("articlesPerPage")
    if (savedArticlesPerPage) {
      setArticlesPerPage(Number(savedArticlesPerPage))
    }
  }, [])

  // Save user preferences to localStorage when they change
  useEffect(() => {
    if (preferredCategories.length > 0) {
      localStorage.setItem("preferredCategories", JSON.stringify(preferredCategories))
    }
  }, [preferredCategories])

  useEffect(() => {
    localStorage.setItem("defaultBiasMode", defaultBiasMode.toString())
  }, [defaultBiasMode])

  useEffect(() => {
    localStorage.setItem("defaultDarkMode", defaultDarkMode.toString())
  }, [defaultDarkMode])

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem("articlesPerPage", articlesPerPage.toString())
  }, [articlesPerPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, showBookmarksOnly, preferredCategories])

  // Filter articles based on search, category, and bookmarks
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      (isBiasedMode
        ? article.titleBiased.toLowerCase().includes(searchQuery.toLowerCase())
        : article.titleUnbiased.toLowerCase().includes(searchQuery.toLowerCase())) ||
      article.snippet.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory

    const matchesPreferences = preferredCategories.length === 0 || preferredCategories.includes(article.category)

    const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)

    return matchesSearch && matchesCategory && matchesBookmarks && matchesPreferences
  })

  // Paginate articles
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage)
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * articlesPerPage, currentPage * articlesPerPage)

  // Get unique categories from articles
  const categories = ["All", ...Array.from(new Set(articles.map((article) => article.category)))]

  // Font size class
  const fontSizeClass = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  }[fontSize]

  // Apply font size to document root for global effect
  useEffect(() => {
    document.documentElement.style.fontSize = {
      small: "0.925rem",
      medium: "1rem",
      large: "1.125rem",
    }[fontSize]
  }, [fontSize])

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme={defaultDarkMode ? "dark" : "light"} enableSystem>
        <div className={`flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200`}>
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
            defaultDarkMode={defaultDarkMode}
            setDefaultDarkMode={setDefaultDarkMode}
            fontSize={fontSize}
            setFontSize={setFontSize}
            articlesPerPage={articlesPerPage}
            setArticlesPerPage={setArticlesPerPage}
          />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
          <main className="flex-1 container mx-auto px-4 py-6">
            <ArticleList
              articles={paginatedArticles}
              isBiasedMode={isBiasedMode}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
            />

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}
