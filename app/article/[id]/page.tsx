"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, Share2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockArticles } from "@/lib/mock-data"
import { formatDate, getCategoryColor, getReadingTime } from "@/lib/utils"
import type { Article } from "@/lib/types"
import { useTheme } from "next-themes"
import { AuthProvider } from "@/lib/auth"
import { motion } from "framer-motion"

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [article, setArticle] = useState<Article | null>(null)
  const [isBiasedMode, setIsBiasedMode] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [fontSize, setFontSize] = useState("medium")

  useEffect(() => {
    // Get article by ID
    const articleId = Number(params.id)
    const foundArticle = mockArticles.find((a) => a.id === articleId)
    if (foundArticle) {
      setArticle(foundArticle)
    } else {
      router.push("/")
    }

    // Load user preferences
    const savedBiasMode = localStorage.getItem("defaultBiasMode")
    if (savedBiasMode) {
      setIsBiasedMode(savedBiasMode === "true")
    }

    const savedBookmarks = localStorage.getItem("bookmarks")
    if (savedBookmarks) {
      const bookmarks = JSON.parse(savedBookmarks)
      setIsBookmarked(bookmarks.includes(articleId))
    }

    const savedFontSize = localStorage.getItem("fontSize")
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
  }, [params.id, router])

  const toggleBookmark = () => {
    if (!article) return

    const savedBookmarks = localStorage.getItem("bookmarks")
    let bookmarks: number[] = savedBookmarks ? JSON.parse(savedBookmarks) : []

    if (isBookmarked) {
      bookmarks = bookmarks.filter((id) => id !== article.id)
    } else {
      bookmarks.push(article.id)
    }

    localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
    setIsBookmarked(!isBookmarked)
  }

  // We don't need fontSizeClass here anymore since we're setting it at the document level
  // in the NewsApp component

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading article...</div>
      </div>
    )
  }

  const title = isBiasedMode ? article.titleBiased : article.titleUnbiased
  const categoryColor = getCategoryColor(article.category)
  const readingTime = getReadingTime(article.content)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to articles
            </Button>

            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className="font-medium transition-colors duration-300"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                  borderColor: `${categoryColor}30`,
                }}
              >
                {article.category}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleBookmark}
                  className={
                    isBookmarked
                      ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                >
                  <Bookmark
                    className={`h-5 w-5 transition-all duration-300 ${isBookmarked ? "scale-110" : "scale-100"}`}
                    fill={isBookmarked ? "currentColor" : "none"}
                  />
                  <span className="sr-only">{isBookmarked ? "Remove bookmark" : "Add bookmark"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="sr-only">Share article</span>
                </Button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {title}
            </h1>

            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-6 gap-x-4 gap-y-2">
              <div className="font-medium text-gray-700 dark:text-gray-300">{article.source}</div>
              <div>{formatDate(article.date)}</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {readingTime}
              </div>
            </div>

            {article.imageUrl && (
              <div className="mb-6 overflow-hidden rounded-lg shadow-md">
                <img
                  src={article.imageUrl || "/placeholder.svg"}
                  alt=""
                  className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose dark:prose-invert max-w-none"
          >
            {article.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </motion.div>
        </div>
      </div>
    </AuthProvider>
  )
}
