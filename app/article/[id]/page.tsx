"use client"

import { useEffect, useState, useRef } from "react"
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
import { SettingsDialog } from "@/components/settings-dialog"
import React from "react"
import { Sparkles } from "lucide-react"
import { articleCache } from "@/lib/article-cache"

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
  const [themePreference, setThemePreference] = useState(false)
  const [articlesPerPage, setArticlesPerPage] = useState(10)
  const [cardSize, setCardSize] = useState(1)
  const [sortOrder, setSortOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [showUnbiased, setShowUnbiased] = useState(false)
  const [loadingUnbiased, setLoadingUnbiased] = useState(false)
  const [unbiasedTitle, setUnbiasedTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = React.useRef(false)
  const { toast } = useToast()

  // Prevent double-fetch: only fetch if not already fetched
  const hasFetched = React.useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    // Try to get article from in-memory cache first
    let cachedArticle: Article | null = null;
    if (typeof window !== 'undefined' && params.id) {
      cachedArticle = articleCache[params.id.toString()] || null;
    }
    if (!cachedArticle && typeof window !== 'undefined' && window.history.state && window.history.state.article) {
      cachedArticle = window.history.state.article;
    }
    if (cachedArticle) {
      setArticle(cachedArticle);
      // Set bookmark state, font size, etc. as before
      const savedBookmarks = localStorage.getItem("bookmarks");
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        setIsBookmarked(bookmarks.includes(cachedArticle.id?.toString()));
      }
      const savedFontSize = localStorage.getItem("fontSize");
      if (savedFontSize) {
        setFontSize(savedFontSize);
      }
      // Track view event (cast id to number if needed)
      let viewId = cachedArticle.id;
      const displayTitle = cachedArticle.titleUnbiased || cachedArticle.title || 'Article';
      trackEvents.articleView(viewId, displayTitle, cachedArticle.source, cachedArticle.category);
      return;
    }
    // Fallback: fetch from API if not in cache or navigation state
    const articleId = params.id?.toString();
    if (!articleId) {
      router.replace("/");
      return;
    }
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/news?ids=${articleId}`);
        if (!response.ok) {
          router.replace("/");
          return;
        }
        const data = await response.json();
        if (data && data.articles && data.articles.length > 0) {
          setArticle(data.articles[0]);
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };
    fetchArticle();
  }, [params.id, router, setTheme])

  useEffect(() => {
    // Fetch all categories for settings dialog, but cache in localStorage to avoid redundant requests
    async function fetchAllCategories() {
      let cached = null;
      if (typeof window !== 'undefined') {
        try {
          cached = JSON.parse(localStorage.getItem('allCategories') || 'null');
        } catch {}
      }
      if (Array.isArray(cached) && cached.length > 0) {
        setAllCategories(cached);
        return;
      }
      try {
        const response = await fetch('/api/sections')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const categories = ['All', ...data.categories.filter((c: string) => c && c !== 'All')];
          setAllCategories(categories)
          if (typeof window !== 'undefined') {
            localStorage.setItem('allCategories', JSON.stringify(categories));
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchAllCategories()
  }, [])

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading article...</div>
      </div>
    )
  }

  // Prefer unbiasedTitle from state if available, then article.titleUnbiased, then fallback
  const displayTitle = showUnbiased
    ? (unbiasedTitle && unbiasedTitle.trim() !== ''
        ? unbiasedTitle
        : (article.titleUnbiased && article.titleUnbiased.trim() !== '' ? article.titleUnbiased : article.title))
    : (article.titleBiased && article.titleBiased.trim() !== '' ? article.titleBiased : article.title)

  // Always prefer titleUnbiased, then titleBiased, then fallback
  const title = article.titleUnbiased || article.titleBiased || article.title || "Untitled";
  const categoryColor = getCategoryColor(article.category || article.section || "Uncategorized")
  const readingTime = getReadingTime(article?.body?.replace(/<[^>]*>/g, '') || '')

  // --- Unbias Title logic (from ArticleCard) ---
  const handleUnbiasClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null)
    if (loadingUnbiased || fetchInProgress.current) return;
    if (showUnbiased) {
      setShowUnbiased(false)
      return;
    }
    if (unbiasedTitle && unbiasedTitle.trim() !== "") {
      setShowUnbiased(true)
      return;
    }
    if (article?.titleUnbiased && article.titleUnbiased.trim() !== "") {
      if (!unbiasedTitle) setUnbiasedTitle(article.titleUnbiased)
      setShowUnbiased(true)
      setLoadingUnbiased(false)
      return;
    }
    setLoadingUnbiased(true)
    fetchInProgress.current = true
    try {
      const res = await fetch("https://rizgap5i.rpcl.app/webhook/unbias-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article?.id, titleBiased: article?.titleBiased || article?.title })
      })
      if (!res.ok) throw new Error('Failed to generate unbiased title')
      const articleRes = await fetch(`/api/news?ids=${article?.id}`)
      if (articleRes.ok) {
        const data = await articleRes.json()
        if (data.article?.titleUnbiased && data.article.titleUnbiased.trim() !== "") {
          setUnbiasedTitle(data.article.titleUnbiased)
        } else {
          setUnbiasedTitle(article?.title)
        }
        setShowUnbiased(true)
      } else {
        setUnbiasedTitle(article?.title)
        setShowUnbiased(true)
        setError('Could not fetch updated unbiased title.')
      }
    } catch (err) {
      setUnbiasedTitle(article?.title)
      setShowUnbiased(true)
      setError('Failed to unbias title. Please try again.')
    } finally {
      setLoadingUnbiased(false)
      fetchInProgress.current = false
    }
  }

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
          customNewsEnabled={false}
          setCustomNewsEnabled={() => {}}
          allCategories={allCategories}
        />
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          categories={allCategories}
          preferredCategories={preferredCategories}
          setPreferredCategories={setPreferredCategories}
          themePreference={themePreference}
          setThemePreference={setThemePreference}
          articlesPerPage={articlesPerPage}
          setArticlesPerPage={setArticlesPerPage}
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
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-medium transition-colors duration-300"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                    borderColor: `${categoryColor}70`, // lighter border
                  }}
                >
                  {article.category || article.section || "Uncategorized"}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-medium transition-colors duration-300 text-yellow-800 border-yellow-300 dark:bg-primary-600 dark:text-blue-400 dark:border-blue-400"
                  style={{}}
                >
                  {showUnbiased ? "Unbiased" : "Biased"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // Toggle bookmark state and update localStorage
                    const articleId = article.id?.toString();
                    if (!articleId) return;
                    let bookmarks = [];
                    try {
                      bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
                    } catch {}
                    let updated;
                    if (bookmarks.includes(articleId)) {
                      updated = bookmarks.filter((id: string) => id !== articleId);
                      setIsBookmarked(false);
                    } else {
                      updated = [...bookmarks, articleId];
                      setIsBookmarked(true);
                    }
                    localStorage.setItem("bookmarks", JSON.stringify(updated));
                  }}
                  className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-gray-100 border- dark:border-gray-800 ${isBookmarked ? 'text-primary' : ''}`}
                  style={{ borderWidth: 1 }}
                >
                  <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span className="sr-only">Bookmark</span>
                </Button>
                {/* AI Icon for Unbias Title button */}
                <div className="flex gap-2 items-center">
                  <Button
                    variant={showUnbiased ? "default" : "outline"}
                    size="icon"
                    onClick={handleUnbiasClick}
                    className="ml-2"
                    title={showUnbiased ? "Show Biased Title" : "Unbias Title with AI"}
                    disabled={loadingUnbiased}
                  >
                    {/* AI Chip (main icon for Unbias Title, matches ArticleCard) */}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2 m-0 p-0">
              {loadingUnbiased ? (
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-8 w-8 my-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-500">
                        <Sparkles className="h-6 w-6 m-1 text-white animate-spin" />
                      </span>
                  </span>
                  <span className="text-blue-500 font-medium text-base">Calling BiasBrief AI Agent…</span>
                </span>
              ) : displayTitle}
            </h1>
            {error && (
              <div className="text-xs text-red-500 mb-2">{error}</div>
            )}

            <div className="flex flex-wrap items-center text-sm mt-3 text-gray-500 dark:text-gray-400 mb-6 gap-x-4 gap-y-2">
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
