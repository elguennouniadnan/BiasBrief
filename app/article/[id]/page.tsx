"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, Share2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, getCategoryColor, getReadingTime } from "@/lib/utils"
import type { Article } from "@/lib/types"
import { useTheme } from "next-themes"
import { AuthProvider } from "@/lib/auth"
import { motion } from "framer-motion"
import { trackEvents } from "@/lib/analytics"
import { useToast } from "@/components/ui/use-toast"
import { Navbar } from "@/components/navbar"

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
    // Get article by ID from localStorage
    const articleId = params.id; // Use the id as a string
    const savedArticles = localStorage.getItem("articles");
    if (savedArticles) {
      const articles: Article[] = JSON.parse(savedArticles);
      const foundArticle = articles.find((a) => a.id === articleId); // Compare as string
      if (foundArticle) {
        setArticle(foundArticle);
        const displayTitle = foundArticle.titleUnbiased || foundArticle.title || 'Article';
        trackEvents.articleView(foundArticle.id, displayTitle, foundArticle.source, foundArticle.category);
      } else {
        router.push("/");
      }
    } else {
      router.push("/");
    }

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
      setIsBookmarked(bookmarks.includes(articleId))
    }

    const savedFontSize = localStorage.getItem("fontSize")
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
  }, [params.id, router, setTheme])

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

  const canShare = () => {
    try {
      const isSecureOrLocalhost = window.location.protocol === 'https:' || 
                                 window.location.hostname === 'localhost' ||
                                 window.location.hostname === '127.0.0.1';
      return isSecureOrLocalhost && typeof navigator.share !== 'undefined';
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    if (!article) return;

    const shareData = {
      title: isBiasedMode ? article.titleBiased : article.titleUnbiased,
      text: article.snippet,
      url: window.location.href
    };

    try {
      const hasNativeShare = canShare();
      if (hasNativeShare) {
        await navigator.share(shareData);
        trackEvents.share('native', article.id);
      } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share it with others",
          duration: 3000,
        });
        trackEvents.share('clipboard', article.id);
      } else {
        toast({
          title: "Copy this link to share",
          description: window.location.href,
          duration: 6000,
        });
        trackEvents.share('manual', article.id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return;
        }
        // Show the URL for any other error
        toast({
          title: "Copy this link to share",
          description: window.location.href,
          duration: 6000,
          variant: err.name === 'NotAllowedError' ? 'default' : 'destructive',
        });
      }
    }
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading article...</div>
      </div>
    )
  }

  const title = isBiasedMode ? article.titleBiased : article.titleUnbiased
  const categoryColor = getCategoryColor(article.category || article.section || "Uncategorized")
  const readingTime = getReadingTime(article?.body?.replace(/<[^>]*>/g, '') || '')

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950">
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
                  onClick={handleShare}
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
            {article.body ? (
              <div dangerouslySetInnerHTML={{ __html: article.body }} />
            ) : (
              <p className="mb-4 leading-relaxed">
                {article.snippet}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </AuthProvider>
  )
}
