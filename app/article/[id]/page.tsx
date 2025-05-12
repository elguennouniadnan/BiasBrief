"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, Share2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCategoryColor, getReadingTime } from "@/lib/utils"
import type { Article } from "@/lib/types"
import { useTheme } from "next-themes"
import { AuthProvider } from "@/lib/auth"
import { motion } from "framer-motion"
import { trackEvents } from "@/lib/analytics"
import { useToast } from "@/components/ui/use-toast"
import { Navbar } from "@/components/navbar"
import React from "react"

// Utility to extract <img> and <figcaption> from imageHtml
function extractImageAndCaption(imageHtml: string): { imgHtml: string | null, captionHtml: string | null } {
  if (!imageHtml) return { imgHtml: null, captionHtml: null }
  const imgMatch = imageHtml.match(/<img[\s\S]*?>/i)
  const captionMatch = imageHtml.match(/<figcaption[\s\S]*?<\/figcaption>/i)
  return {
    imgHtml: imgMatch ? imgMatch[0] : null,
    captionHtml: captionMatch ? captionMatch[0] : null
  }
}

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [article, setArticle] = useState<Article | null>(null)
  const [isBiasedMode, setIsBiasedMode] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [searchQuery, setSearchQuery] = useState("")
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [preferredCategories, setPreferredCategories] = useState<string[]>([])
  const [defaultBiasMode, setDefaultBiasMode] = useState(false)
  const [themePreference, setThemePreference] = useState(false)
  const [articlesPerPage, setArticlesPerPage] = useState(10)
  const [cardSize, setCardSize] = useState(1)
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const { toast } = useToast()

  useEffect(() => {
    // Get article by ID from Firestore API, not localStorage
    const fetchArticle = async () => {
      const articleId = params.id?.toString();
      if (!articleId) {
        router.replace("/");
        return;
      }
      try {
        const response = await fetch(`/api/news/${articleId}`);
        if (!response.ok) {
          router.replace("/");
          return;
        }
        const data = await response.json();
        console.log("Fetched article data:", data);
        if (data && data.article) {
          setArticle(data.article);
          const displayTitle = data.article.titleUnbiased || data.article.title || 'Article';
          trackEvents.articleView(data.article.id, displayTitle, data.article.source, data.article.category);
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };
    fetchArticle();

    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // Load user preferences
    const savedBiasMode = localStorage.getItem("defaultBiasMode")
    if (savedBiasMode) {
      setIsBiasedMode(savedBiasMode === "true")
    }

    const savedBookmarks = localStorage.getItem("bookmarks")
    if (savedBookmarks) {
      const bookmarks = JSON.parse(savedBookmarks)
      setIsBookmarked(bookmarks.includes(params.id?.toString()))
    }

    const savedFontSize = localStorage.getItem("fontSize")
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
  }, [params.id, router, setTheme])

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading article...</div>
      </div>
    )
  }

  // Always prefer titleUnbiased, then titleBiased, then fallback
  const title = article.titleUnbiased || article.titleBiased || article.title || "Untitled";
  const categoryColor = getCategoryColor(article.category || article.section || "Uncategorized")
  const readingTime = getReadingTime(article?.body?.replace(/<[^>]*>/g, '') || '')

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar 
          searchQuery={searchQuery}
          setSearchQuery={(query) => {
            setSearchQuery(query);
            trackEvents.search(query);
          }}
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
          categories={article.category ? [article.category] : []}
          defaultBiasMode={defaultBiasMode}
          setDefaultBiasMode={setDefaultBiasMode}
          customNewsEnabled={false}
          setCustomNewsEnabled={() => {}}
        />
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
                {article.category || article.section || "Uncategorized"}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {}}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Bookmark className="h-5 w-5" />
                  <span className="sr-only">Bookmark</span>
                </Button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {title}
            </h1>

            <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-6 gap-x-4 gap-y-2">
              <div className="font-medium text-gray-700 dark:text-gray-300">{article.source}</div>
              <div>{article.date}</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {readingTime}
              </div>
            </div>

            {/* Show imageHtml if present, else imageUrl or image, else placeholder */}
            {article.imageHtml ? (() => {
              const { imgHtml, captionHtml } = extractImageAndCaption(article.imageHtml)
              return (
                <div className="mb-6 overflow-hidden rounded-lg shadow-md" style={{ maxWidth: 600, margin: '0 auto' }}>
                  {imgHtml && (
                    <div style={{ width: '100%' }}>
                      <div dangerouslySetInnerHTML={{ __html: imgHtml }} style={{ width: '100%' }} />
                    </div>
                  )}
                  {captionHtml && (
                    <div className="bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 px-4 py-2 border-t border-gray-200 dark:border-gray-800" style={{ width: '100%' }}>
                      <div dangerouslySetInnerHTML={{ __html: captionHtml }} style={{ width: '100%' }} />
                    </div>
                  )}
                </div>
              )
            })() : article.imageUrl || article.image ? (
              <div className="mb-6 overflow-hidden rounded-lg shadow-md">
                <img
                  src={article.imageUrl || article.image}
                  alt={title || 'Article image'}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: 400 }}
                />
              </div>
            ) : (
              <div className="mb-6 overflow-hidden rounded-lg shadow-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center" style={{height: 200}}>
                <img src="/placeholder.svg" alt="No image available" className="h-24 opacity-40" />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose dark:prose-invert max-w-none"
          >
            {article.body ? (
              <div dangerouslySetInnerHTML={{ __html: article.body }} />
            ) : (
              <p className="mb-4 leading-relaxed">{article.snippet}</p>
            )}
          </motion.div>
        </div>
      </div>
    </AuthProvider>
  )
}
