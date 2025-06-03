"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { CategoryFilter } from "@/components/category-filter"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { ArticleList } from "@/components/article-list"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Article } from "@/lib/types"

export default function ListPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [fontSize, setFontSize] = useState("medium")
  const [articlesPerPage, setArticlesPerPage] = useState(9)

  useEffect(() => {
    async function fetchArticles() {
      const q = query(collection(db, "articles"), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)
      const fetched: Article[] = []
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Article)
      })
      setArticles(fetched)
    }
    fetchArticles()
  }, [])

  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarks")
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  }, [bookmarks])

  const toggleBookmark = (articleId: string) => {
    setBookmarks((prev) => {
      if (prev.includes(articleId)) {
        return prev.filter((id) => id !== articleId)
      } else {
        return [...prev, articleId]
      }
    })
  }

  useEffect(() => {
    const savedPreferredCategories = localStorage.getItem("preferredCategories")
    if (savedPreferredCategories) {
      setPreferredCategories(JSON.parse(savedPreferredCategories))
    } else {
      setPreferredCategories(Array.from(new Set(articles.map((article) => article.category).filter((c): c is string => Boolean(c)))))
    }
  }, [articles])

  useEffect(() => {
    if (preferredCategories.length > 0) {
      localStorage.setItem("preferredCategories", JSON.stringify(preferredCategories))
    }
  }, [preferredCategories])

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem("articlesPerPage", articlesPerPage.toString())
  }, [articlesPerPage])

  useEffect(() => {
    const size =
      fontSize === "small"
        ? "0.925rem"
        : fontSize === "large"
        ? "1.125rem"
        : "1rem"
    document.documentElement.style.fontSize = size
  }, [fontSize])

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory
    const matchesPreferences = preferredCategories.length === 0 || (article.category && preferredCategories.includes(article.category))
    const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(article.id)
    return matchesCategory && matchesPreferences && matchesBookmarks
  })

  const categories = ["All", ...Array.from(new Set(articles.map((article) => article.category).filter((c): c is string => Boolean(c))))]

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
            <ArticleList
              articles={filteredArticles}
              isBookmarked={(id: string) => bookmarks.includes(id)}
              toggleBookmark={toggleBookmark}
            />
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}
