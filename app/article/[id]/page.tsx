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
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { SettingsDialog } from "@/components/settings-dialog"
import React from "react"
import { Sparkles } from "lucide-react"
import { articleCache } from "@/lib/article-cache"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [customNewsEnabled, setCustomNewsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("customNewsEnabled");
      if (saved !== null) return JSON.parse(saved);
    }
    return false;
  });
  const fetchInProgress = React.useRef(false)

  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [summarizedHtml, setSummarizedHtml] = useState<string | null>(null)
  const [summarizeLoading, setSummarizeLoading] = useState(false)
  const [summarizeError, setSummarizeError] = useState<string | null>(null)

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("customNewsEnabled", JSON.stringify(customNewsEnabled));
    }
  }, [customNewsEnabled]);

  useEffect(() => {
    console.log('[ArticlePage] loaded article:', article);
  }, [article]);

  const handleSummarize = async () => {
    if (!article || !article.body) {
      setSummarizeError("Article content is not available.");
      return;
    }
    // If unbiased_summary is already present, just show it
    if (article.unbiased_summary) {
      setSummarizedHtml(article.unbiased_summary);
      setSummarizeError(null);
      setSummarizeLoading(false);
      setSummaryDialogOpen(true);
      setSummaryRevealed(true);
      return;
    }
    setSummarizeLoading(true)
    setSummarizeError(null)
    setSummarizedHtml(null)
    try {
      const res = await fetch("https://rizgap5i.rpcl.app/webhook/summarize-and-unbias-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, body: article.body })
      })
      if (!res.ok) throw new Error("Failed to summarize and unbias article")
      const data = await res.json()
      if (Array.isArray(data) && data[0] && data[0].unbiased_summary) {
        setSummarizedHtml(data[0].unbiased_summary)
        setSummaryDialogOpen(true)
        setSummaryRevealed(true)
        // Update article cache and state with new unbiased_summary
        setArticle(prev => {
          if (!prev) return prev;
          const updated = { ...prev, unbiased_summary: data[0].unbiased_summary };
          if (typeof window !== 'undefined' && updated.id) {
            articleCache[updated.id] = updated;
            // Update in-memory articlesListCache as well
            import('@/lib/article-list-cache').then(({ articlesListCache, setArticlesListCache }) => {
              Object.keys(articlesListCache).forEach((key) => {
                const cache = articlesListCache[key];
                if (!cache || !Array.isArray(cache.articles)) return;
                let changed = false;
                const newArticles = cache.articles.map(a => {
                  if (a.id === updated.id && a.unbiased_summary !== updated.unbiased_summary) {
                    changed = true;
                    return { ...a, unbiased_summary: updated.unbiased_summary };
                  }
                  return a;
                });
                if (changed) {
                  setArticlesListCache(key, { ...cache, articles: newArticles });
                }
              });
            });
          }
          return updated;
        })
      } else if (data && typeof data === 'object' && data.unbiased_summary) {
        setSummarizedHtml(data.unbiased_summary)
        setSummaryDialogOpen(true)
        setSummaryRevealed(true)
        // Update article cache and state with new unbiased_summary
        setArticle(prev => {
          if (!prev) return prev;
          const updated = { ...prev, unbiased_summary: data.unbiased_summary };
          if (typeof window !== 'undefined' && updated.id) {
            articleCache[updated.id] = updated;
            // Update in-memory articlesListCache as well
            import('@/lib/article-list-cache').then(({ articlesListCache, setArticlesListCache }) => {
              Object.keys(articlesListCache).forEach((key) => {
                const cache = articlesListCache[key];
                if (!cache || !Array.isArray(cache.articles)) return;
                let changed = false;
                const newArticles = cache.articles.map(a => {
                  if (a.id === updated.id && a.unbiased_summary !== updated.unbiased_summary) {
                    changed = true;
                    return { ...a, unbiased_summary: updated.unbiased_summary };
                  }
                  return a;
                });
                if (changed) {
                  setArticlesListCache(key, { ...cache, articles: newArticles });
                }
              });
            });
          }
          return updated;
        })
      } else {
        setSummarizeError("No summary returned from server.")
      }
    } catch (err: any) {
      setSummarizeError(err.message || "Unknown error")
    } finally {
      setSummarizeLoading(false)
    }
  }

  // Track if user has already triggered unbiased title loading (for 3s animation)
  const hasUnbiasedTitleAnimationRun = useRef(false)
  const [showUnbiasedLoading, setShowUnbiasedLoading] = useState(false)
  const unbiasedLoadingTimeout = useRef<NodeJS.Timeout | null>(null)

  // --- Unbias Title logic (from ArticleCard) ---
  const handleUnbiasClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null)
    if (loadingUnbiased || fetchInProgress.current) return;
    if (showUnbiased) {
      setShowUnbiased(false)
      return;
    }
    // Only show the 3s animation the first time the user clicks (if unbiased title is present)
    if ((unbiasedTitle && unbiasedTitle.trim() !== "") || (article?.titleUnbiased && article.titleUnbiased.trim() !== "")) {
      if (!hasUnbiasedTitleAnimationRun.current) {
        if (!unbiasedTitle && article?.titleUnbiased) setUnbiasedTitle(article.titleUnbiased)
        setShowUnbiasedLoading(true)
        hasUnbiasedTitleAnimationRun.current = true
        unbiasedLoadingTimeout.current = setTimeout(() => {
          setShowUnbiasedLoading(false)
          setShowUnbiased(true)
        }, 3000)
        return;
      } else {
        setShowUnbiased(true)
        return;
      }
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
      let newUnbiasedTitle = article?.title;
      if (articleRes.ok) {
        const data = await articleRes.json()
        if (data.articles && data.articles[0] && data.articles[0].titleUnbiased && data.articles[0].titleUnbiased.trim() !== "") {
          newUnbiasedTitle = data.articles[0].titleUnbiased;
          setUnbiasedTitle(newUnbiasedTitle)
        } else {
          setUnbiasedTitle(article?.title)
        }
        setShowUnbiased(true)
      } else {
        setUnbiasedTitle(article?.title)
        setShowUnbiased(true)
        setError('Could not fetch updated unbiased title.')
      }
      // --- Update cached article list with new unbiased title ---
      if (typeof window !== 'undefined' && article?.id && newUnbiasedTitle) {
        try {
          // Update in-memory articlesListCache
          const { articlesListCache, setArticlesListCache } = await import('@/lib/article-list-cache');
          Object.keys(articlesListCache).forEach((key) => {
            const cache = articlesListCache[key];
            if (!cache || !Array.isArray(cache.articles)) return;
            let updated = false;
            const newArticles = cache.articles.map(a => {
              if (a.id === article.id && a.titleUnbiased !== newUnbiasedTitle) {
                updated = true;
                return { ...a, titleUnbiased: newUnbiasedTitle };
              }
              return a;
            });
            if (updated) {
              setArticlesListCache(key, { ...cache, articles: newArticles });
            }
          });
        } catch (err) {
          // fail silently
        }
      }
      // ---
    } catch (err) {
      setUnbiasedTitle(article?.title)
      setShowUnbiased(true)
      setError('Failed to unbias title. Please try again.')
    } finally {
      setLoadingUnbiased(false)
      fetchInProgress.current = false
    }
  }

  // Track if user has already triggered unbiased summary animation (for 3s animation)
  const hasUnbiasedSummaryAnimationRun = useRef(false)
  const [showSummaryLoading, setShowSummaryLoading] = useState(false)
  const summaryLoadingTimeout = useRef<NodeJS.Timeout | null>(null)

  // Track if user has revealed the summary (after first click/animation)
  const [summaryRevealed, setSummaryRevealed] = useState(false);

  const handleSummarizeButtonClick = () => {
    const summary = article && article.unbiased_summary;
    // If summary exists and it's the first click, show animation for 3s, then show dialog and summary
    if (summary && !hasUnbiasedSummaryAnimationRun.current && !summarizedHtml) {
      setShowSummaryLoading(true);
      summaryLoadingTimeout.current = setTimeout(() => {
        setShowSummaryLoading(false);
        setSummaryDialogOpen(true);
        setSummarizedHtml(summary);
        hasUnbiasedSummaryAnimationRun.current = true;
        setSummaryRevealed(true);
      }, 3000);
      return;
    }
    // On subsequent clicks, just open dialog and show summary instantly
    if (summary || summarizedHtml) {
      setSummaryDialogOpen(true);
      if (!summarizedHtml && summary) setSummarizedHtml(summary);
      hasUnbiasedSummaryAnimationRun.current = true;
      setSummaryRevealed(true);
      return;
    }
    // If no summary, run the normal summarize logic
    // Do NOT open dialog yet; open it after summary is set in handleSummarize
    if (!summarizedHtml && !summarizeLoading) handleSummarize();
  };

  useEffect(() => {
    return () => {
      if (unbiasedLoadingTimeout.current) clearTimeout(unbiasedLoadingTimeout.current)
      if (summaryLoadingTimeout.current) clearTimeout(summaryLoadingTimeout.current)
    }
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

  return (
    <AuthProvider>
      <div className="min-h-screen relative">
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
          customNewsEnabled={customNewsEnabled}
          setCustomNewsEnabled={setCustomNewsEnabled}
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
        {/* Full-bleed gradient background for the whole article page */}
        <div
          className="fixed inset-0 z-0 w-full h-full bg-gradient-to-br from-[#fffbe6] via-[#f0f4ff] to-[#e6fff9] dark:from-blue-950/20 dark:via-blue-950/30 dark:to-blue-950/60 dark:bg-gradient-to-br pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative container mx-auto px-4 py-8 z-10">
          <div
            className="relative w-full rounded-xl min-h-[100vh] pt-0 pb-8 px-0 sm:px-0 flex flex-col items-center justify-start"
          >
            <div className="container mx-auto px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    // Print the list of articles used to display the list
                    import('@/lib/article-list-cache').then(({ articlesListCache }) => {
                      console.log('[Back to articles] articlesListCache:', articlesListCache);
                    });
                    router.back();
                  }}
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
                        backgroundColor: `${categoryColor}20`,
                        color: `${categoryColor}`,
                        borderColor: `${categoryColor}`, // lighter border
                      }}
                    >
                      {article.category || article.section || "Uncategorized"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="font-medium transition-colors duration-300 text-orange-500 bg-orange-100 dark:text-primary-light border-orange-400 dark:border-primary-light dark:bg-primary-light/20"
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
                      className={`hover:bg-white dark:hover:bg-gray-800 transition-colors border-gray-100 border- dark:border-gray-800 ${isBookmarked ? 'text-primary' : ''}`}
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
                        className="ml-2 hover:bg-white bg-transparent dark:bg-transparent dark:hover:bg-gray-800 transition-colors"
                        title={showUnbiased ? "Show Biased Title" : "Unbias Title with AI"}
                        disabled={loadingUnbiased}
                      >
                        {/* if showUnbiased is true, show the Sparkles icon in white */}
                        <Sparkles className={`h-4 w-4 ${showUnbiased ? 'text-white' : 'text-amber-500'}`} />
                      </Button>
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2 m-0 p-0">
                  {(loadingUnbiased || showUnbiasedLoading) ? (
                    <div className="w-full flex justify-center items-center h-20">
                      {theme === 'dark' ? (
                        <DotLottieReact
                          src="https://lottie.host/bb7e5e2b-d41b-4006-b557-038ceca5ac19/h8qTPdwZXn.lottie"
                          loop
                          speed={2}
                          autoplay
                        />
                      ) : (
                        <DotLottieReact
                          src="https://lottie.host/5b37c7be-2940-4faf-bd6a-69dd69a5a115/1fj6mX7aib.lottie"
                          loop
                          speed={2}
                          autoplay
                        />
                      )}
                    </div>
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


                {/* --- End Summarize & Unbias Button --- */}
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

              {/* --- Summarize & Unbias Button (centered above image) --- */}
              <div className="flex justify-center my-6">
                <div className="flex flex-col items-center w-full">
                  {(showSummaryLoading || summarizeLoading) && (
                    <div className="w-full flex justify-center items-center h-20 mb-2">
                      {theme === 'dark' ? (
                        <DotLottieReact
                          src="https://lottie.host/bb7e5e2b-d41b-4006-b557-038ceca5ac19/h8qTPdwZXn.lottie"
                          loop
                          speed={2}
                          autoplay
                        />
                      ) : (
                        <DotLottieReact
                          src="https://lottie.host/5b37c7be-2940-4faf-bd6a-69dd69a5a115/1fj6mX7aib.lottie"
                          loop
                          speed={2}
                          autoplay
                        />
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSummarizeButtonClick}
                    disabled={summarizeLoading || showSummaryLoading}
                    className="flex items-center gap-2 text-amber-600 dark:text-amber-500"
                  >
                    <Sparkles className="h-5 w-5" />
                    {(showSummaryLoading || summarizeLoading)
                      ? "Summarizing and unbiasing..."
                      : summaryRevealed
                        ? "Unbiased Summary"
                        : "Summarize & Unbias Article"}
                  </Button>
                </div>
              </div>

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
            <Dialog open={summaryDialogOpen} onOpenChange={(open) => setSummaryDialogOpen(open)}>
              <DialogContent className="w-[85vw] max-w-5xl sm:w-[85vw] sm:max-w-5xl xs:w-[80vw] xs:max-w-full">
                <DialogHeader className="flex items-center justify-between text-amber-500 my-2">
                  <DialogTitle>Unbiased Summary</DialogTitle>
                </DialogHeader>
                {showSummaryLoading && (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-full flex justify-center items-center h-20">
                      {theme === 'dark' ? (
                        <DotLottieReact
                          src="https://lottie.host/bb7e5e2b-d41b-4006-b557-038ceca5ac19/h8qTPdwZXn.lottie"
                          loop
                          speed={2}
                          autoplay
                        />
                      ) : (
                        <DotLottieReact
                          src="https://lottie.host/5b37c7be-2940-4faf-bd6a-69dd69a5a115/1fj6mX7aib.lottie"
                          loop
                          speed={2}
                          autoplay
                        />
                      )}
                    </div>
                    <span className="mt-2 text-gray-500 dark:text-gray-300">Summarizing...</span>
                  </div>
                )}
                {summarizeError && <div className="text-red-500 py-4">{summarizeError}</div>}
                {summarizedHtml && (
                  <div
                    className="prose dark:prose-invert max-w-none overflow-y-auto px-1"
                    style={{ WebkitOverflowScrolling: 'touch', maxHeight: '60vh' }}
                    dangerouslySetInnerHTML={{ __html: summarizedHtml }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
