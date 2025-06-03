// StoriesPageClient.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { ArticleList } from "@/components/article-list"
import { Pagination } from "@/components/pagination"
import type { Article } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"

interface StoriesPageClientProps {
  initialArticles: Article[]
  initialCategories: string[]
}

export default function StoriesPageClient({ initialArticles, initialCategories }: StoriesPageClientProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
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

  // ...existing useEffects for bookmarks, preferredCategories, fontSize, etc...

  // On mount, check for ?search= param and set searchQuery
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Filtering (add searchQuery support)
  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory
    const matchesPreferences = preferredCategories.length === 0 || (article.category && preferredCategories.includes(article.category))
    const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)
    const matchesSearch = !searchQuery.trim() || (
      (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.titleBiased && article.titleBiased.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.titleUnbiased && article.titleUnbiased.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.snippet && article.snippet.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.body && article.body.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    return matchesCategory && matchesPreferences && matchesBookmarks && matchesSearch
  })

  // Paging
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / articlesPerPage))
  const pagedArticles = useMemo(() => filteredArticles.slice((currentPage - 1) * articlesPerPage, currentPage * articlesPerPage), [filteredArticles, currentPage, articlesPerPage])

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
        <ThemeProvider attribute="class" enableSystem>
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
        </ThemeProvider>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" enableSystem>
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
            setSelectedCategory={setSelectedCategory}
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
                  articles={pagedArticles}
                  isBookmarked={(id: string) => bookmarks.includes(id)}
                  toggleBookmark={toggleBookmark}
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
            )}
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}
