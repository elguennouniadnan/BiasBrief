"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, Share2, Clock, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCategoryColor, getReadingTime, formatDateInUserTimezone } from "@/lib/utils"
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

  // --- Chatbot UI state ---
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Helper to strip HTML and truncate to 600 words
  function getTruncatedText(html: string, wordLimit: number) {
    if (!html) return '';
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean);
    return words.slice(0, wordLimit).join(' ');
  }

  // Fetch possible questions when chat opens
  useEffect(() => {
    if (!chatOpen) return;
    // Only fetch if no messages yet
    if (chatMessages.length > 0) return;
    if (!article) return;
    setChatLoading(true);
    setChatError(null);

    // Directly read possible questions from article.possibleQuestion1 and article.possibleQuestion2
    const questions: string[] = [];
    if (article.possibleQuestion1 && typeof article.possibleQuestion1 === 'string' && article.possibleQuestion1.trim() !== '') {
      questions.push(article.possibleQuestion1.trim());
    }
    if (article.possibleQuestion2 && typeof article.possibleQuestion2 === 'string' && article.possibleQuestion2.trim() !== '') {
      questions.push(article.possibleQuestion2.trim());
    }
    if (questions.length > 0) {
      setChatMessages([{ role: 'bot', content: 'Here are some questions you can ask:' }]);
      setSuggestedQuestions(questions);
      setChatLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const truncatedBody = getTruncatedText(article.body || '', 600);
        const res = await fetch("https://rizgap5i.rpcl.app/webhook/get-possible-questions-about-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: article.id,
            title: article.titleBiased,
            snippet: article.snippet,
            body: truncatedBody,
            summary: article.unbiased_summary,
            possibleQuestion1: article.possibleQuestion1,
            possibleQuestion2: article.possibleQuestion2,
          })
        });
        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();
        console.log('[Chatbot] fetched questions:', data);
        // Accept object with question1, question2, ... or array of such objects
        let questions: string[] = [];
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          Object.values(data).forEach((val) => {
            if (typeof val === 'string' && val.trim() !== '') {
              questions.push(val.trim());
            }
          });
        } else if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          data.forEach((obj: any) => {
            Object.values(obj).forEach((val) => {
              if (typeof val === 'string' && val.trim() !== '') {
                questions.push(val.trim());
              }
            });
          });
        } else if (Array.isArray(data)) {
          questions = data;
        } else if (data && Array.isArray(data.questions)) {
          questions = data.questions;
        }
        if (questions.length > 0) {
          setChatMessages([{ role: 'bot', content: 'Here are some questions you can ask:' }]);
          setSuggestedQuestions(questions);
        } else {
          setChatMessages([{ role: 'bot', content: 'No suggested questions found for this article.' }]);
          setSuggestedQuestions([]);
        }
      } catch (err: any) {
        setChatError(err.message || 'Failed to load questions.');
        setChatMessages([{ role: 'bot', content: 'Sorry, I could not load suggested questions.' }]);
      } finally {
        setChatLoading(false);
      }
    };
    fetchQuestions();
  }, [chatOpen, article]);

  // Helper to send user question to AI and display answer
  async function handleUserQuestion(question: string) {
    setChatMessages(msgs => [...msgs, { role: 'user', content: question }]);
    setChatLoading(true);
    setSuggestedQuestions([]);
    if (!article) {
      setChatMessages(msgs => [...msgs, { role: 'bot', content: 'Article data is not available.' }]);
      setChatLoading(false);
      return;
    }
    try {
      const truncatedBody = getTruncatedText(article.body || '', 600);
      const res = await fetch("https://rizgap5i.rpcl.app/webhook/chat-with-ai-about-a-news-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          article: {
            id: article.id,
            titleBiased: article.titleBiased,
            snippet: article.snippet,
            body: truncatedBody,
            summary: article.unbiased_summary,
            possibleQuestion1: article.possibleQuestion1,
            possibleQuestion2: article.possibleQuestion2,
            answerToPossibleQuestion1: article.answerToPossibleQuestion1,
            answerToPossibleQuestion2: article.answerToPossibleQuestion2,
          }
        })
      });
      if (!res.ok) throw new Error("Failed to get AI answer");
      const data = await res.json();
      console.log('[Chatbot] AI response:', data);
      let answer = '';
      if (typeof data === 'string') {
        answer = data;
      } else if (data && typeof data.answer === 'string') {
        answer = data.answer;
      } else if (data && typeof data.output === 'string') {
        answer = data.output;
      } else if (data && data.response) {
        answer = data.response;
      } else {
        answer = 'Sorry, I could not get an answer.';
      }
      setChatMessages(msgs => [...msgs, { role: 'bot', content: answer }]);
    } catch (err: any) {
      setChatMessages(msgs => [...msgs, { role: 'bot', content: err.message || 'Failed to get answer.' }]);
    } finally {
      setChatLoading(false);
    }
  }

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
          className="fixed inset-0 z-0 w-full h-full bg-gradient-to-br from-[#fffbe6] via-[#f0f4ff] to-[#e6fff9] dark:from-blue-950/20 dark:via-blue-950/10 dark:to-blue-950/10 dark:bg-gradient-to-br pointer-events-none"
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
                        <Sparkles className={`h-4 w-4 ${showUnbiased ? 'text-amber-500' : 'dark:text-white text-black'}`} />
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
                  <div>{formatDateInUserTimezone(article.date)}</div>
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
        {/* --- Chatbot UI Trigger --- */}
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-3 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition md:bottom-6 md:right-6"
          style={{ display: chatOpen ? 'none' : 'flex' }}
          aria-label="Open AI Chatbot"
          onClick={() => setChatOpen(true)}
        >
          <Bot className="w-7 h-7" />
        </button>
        {/* --- Chatbot UI --- */}
        {chatOpen && (
          <div className="fixed bottom-0 right-0 w-[90vw] md:w-[400px] md:bottom-6 md:right-6 z-50 flex flex-col items-end left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 mb-2 md:mb-0">
            <div className="bg-gradient-to-br from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-950/90 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-2xl w-full md:w-[400px] max-h-[60vh] flex flex-col backdrop-blur-md">
              <div className="flex items-center justify-between p-4 border-b border-blue-100 dark:border-blue-800 font-semibold text-base text-blue-900 dark:text-blue-100 rounded-t-2xl bg-gradient-to-r from-blue-200/60 via-white/60 to-blue-100/60 dark:from-blue-950/60 dark:via-gray-900/60 dark:to-blue-900/60">
                <span className="flex items-center gap-2"><Bot className="w-5 h-5 text-blue-500 dark:text-blue-300 animate-pulse" /> Ask the AI Bot</span>
                <button
                  className="ml-2 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                  aria-label="Close chatbot"
                  onClick={() => setChatOpen(false)}
                  type="button"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm custom-scrollbar" style={{ minHeight: 120, maxHeight: 240 }}>
                {chatError ? (
                  <div className="text-red-500 text-xs text-center">{chatError}</div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-gray-400 text-xs text-center">Start a conversation about this article...</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <span className={msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-400/80 to-blue-600/80 text-white rounded-2xl px-4 py-2 shadow-md max-w-[80%] break-words'
                        : 'bg-gradient-to-r from-gray-100/80 to-blue-100/80 dark:from-blue-950/80 dark:to-gray-900/80 text-blue-900 dark:text-blue-100 rounded-2xl px-4 py-2 shadow max-w-[80%] break-words'}>
                        {msg.content}
                      </span>
                    </div>
                  ))
                )}
                {/* 3 dots animation for bot typing */}
                {chatLoading && (
                  <div className="flex justify-start mt-2">
                    <span className="inline-block bg-gradient-to-r from-gray-100/80 to-blue-100/80 dark:from-blue-950/80 dark:to-gray-900/80 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-2">
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0ms' }}></span>
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '150ms' }}></span>
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                )}
              </div>
              {/* Suggested questions at the bottom, above input */}
              {suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap justify-center w-full gap-2 px-4 pb-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1 text-xs hover:bg-blue-200 dark:hover:bg-blue-900 transition cursor-pointer shadow-sm"
                      type="button"
                      onClick={() => {
                        handleUserQuestion(q);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <form className="flex items-center border-t border-blue-100 dark:border-blue-800 p-3 bg-gradient-to-r from-blue-50/60 via-white/60 to-blue-100/60 dark:from-blue-950/60 dark:via-gray-900/60 dark:to-blue-900/60 rounded-b-2xl" onSubmit={e => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                handleUserQuestion(chatInput);
                setChatInput("");
              }}>
                <input
                  type="text"
                  className="flex-1 rounded-full border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  placeholder="Type your question..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  autoComplete="off"
                  disabled={chatLoading}
                />
                <button type="submit" className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full text-sm font-semibold hover:from-blue-600 hover:to-blue-800 transition shadow-md disabled:opacity-60" disabled={chatLoading}>Send</button>
              </form>
            </div>
          </div>
        )}
        {/* --- End Chatbot UI --- */}
      </div>
    </AuthProvider>
  )
}
