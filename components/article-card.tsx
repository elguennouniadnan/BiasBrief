"use client"

import { Bookmark, Sparkles, FolderHeart } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"
import { getCategoryColor } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { articleCache } from "@/lib/article-cache"

interface ArticleCardProps {
  article: Article
  isBookmarked: boolean
  toggleBookmark: (id: string) => void
  cardSize: number
  onUnbiasTitle?: (id: string, unbiasedTitle: string) => void // new prop
}

export function ArticleCard({ article, isBookmarked, toggleBookmark, cardSize, onUnbiasTitle }: ArticleCardProps) {
  const [showUnbiased, setShowUnbiased] = useState(false)
  const [loadingUnbiased, setLoadingUnbiased] = useState(false)
  const [unbiasedTitle, setUnbiasedTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)
  const router = useRouter();

  // Prefer unbiasedTitle from state if available, then article.titleUnbiased, then fallback
  const displayTitle = showUnbiased
    ? (unbiasedTitle && unbiasedTitle.trim() !== ''
        ? unbiasedTitle
        : (article.titleUnbiased && article.titleUnbiased.trim() !== '' ? article.titleUnbiased : article.title))
    : (article.titleBiased && article.titleBiased.trim() !== '' ? article.titleBiased : article.title)
    
  const categoryColor = getCategoryColor(article.category || article.section) // Use category or fallback to section
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  const imageSize = cardSize === 1 ? "15rem" : "8rem"
  const isSingleColumn = cardSize === 1
  const isCompactLayout = cardSize === 4
  
  // Use either imageUrl or image property, whichever is available
  const imageSource = article.imageUrl || article.image || "/placeholder.svg"
  
  // Use snippet or description as fallback
  const snippetText = article.snippet || article.description

  useEffect(() => {
    if (!isSingleColumn || !contentRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(contentRef.current)
    return () => resizeObserver.disconnect()
  }, [isSingleColumn])

  // Reset unbiasedTitle and error if article changes
  useEffect(() => {
    setUnbiasedTitle(null)
    setShowUnbiased(false)
    setError(null)
  }, [article.id])

  const handleUnbiasClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click from firing
    setError(null)
    if (loadingUnbiased || fetchInProgress.current) return;
    if (showUnbiased) {
      setShowUnbiased(false)
      return;
    }
    // If unbiasedTitle is already set and non-empty, just show it
    if (unbiasedTitle && unbiasedTitle.trim() !== "") {
      setShowUnbiased(true)
      return;
    }
    // If article.titleUnbiased exists and is not empty, just show it (no fetch)
    if (article.titleUnbiased && article.titleUnbiased.trim() !== "") {
      if (!unbiasedTitle) setUnbiasedTitle(article.titleUnbiased)
      setShowUnbiased(true)
      setLoadingUnbiased(false)
      if (onUnbiasTitle) {
        onUnbiasTitle(article.id, article.titleUnbiased)
      }
      return;
    }
    // Otherwise, fetch unbiased title
    setLoadingUnbiased(true)
    fetchInProgress.current = true
    try {
      const res = await fetch("https://rizgap5i.rpcl.app/webhook/unbias-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, titleBiased: article.titleBiased || article.title })
      })
      if (!res.ok) throw new Error('Failed to generate unbiased title')
      // Always fetch the updated article from Firestore after webhook
      const articleRes = await fetch(`/api/news?ids=${article.id}`)
      let unbiased = article.title;
      if (articleRes.ok) {
        const data = await articleRes.json();
        if (data.articles && data.articles[0] && data.articles[0].titleUnbiased && data.articles[0].titleUnbiased.trim() !== "") {
          unbiased = data.articles[0].titleUnbiased;
        }
      }
      setUnbiasedTitle(unbiased)
      setShowUnbiased(true)
      if (onUnbiasTitle) {
        onUnbiasTitle(article.id, unbiased)
      }
    } catch (err) {
      setUnbiasedTitle(article.title)
      setShowUnbiased(true)
      setError('Failed to unbias title. Please try again.')
    } finally {
      setLoadingUnbiased(false)
      fetchInProgress.current = false
    }
  }

  return (
    <div className="px-2 sm:px-0">
      <Card
        className="overflow-hidden h-full flex flex-col group shadow-md p-1 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg dark:shadow-blue-900/40 transition-all duration-300 border-t-2 hover:-translate-y-1"
        style={{ borderTopColor: categoryColor }}
      >
        <div
          className="flex-grow flex flex-col cursor-pointer"
          onClick={() => {
            if (typeof window !== 'undefined') {
              articleCache[article.id] = article;
              window.history.replaceState({ ...(window.history.state || {}), article }, '');
            }
            router.push(`/article/${article.id}`);
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <CardHeader className={`p-2 sm:p-4 pb-1 sm:pb-2 flex flex-col gap-2 sm:gap-4 ${isSingleColumn ? 'flex-1' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="self-start mb-0.5 sm:mb-1 font-medium transition-colors duration-300"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                    borderColor: `${categoryColor}10`,
                  }}
                >
                  {article.category || article.section}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-medium transition-colors mb-0.5 sm:mb-1 duration-300 text-yellow-800 border-yellow-300 dark:bg-primary-600 dark:text-blue-500 dark:border-blue-900 dark:bg-blue-950"
                  style={{}}
                >
                  {showUnbiased ? "Unbiased" : "Biased"}
                </Badge>
              </div>
              <Button
                variant={showUnbiased ? "default" : "outline"}
                size="icon"
                onClick={handleUnbiasClick}
                className="ml-2"
                title={showUnbiased ? "Show Biased Title" : "Unbias Title with AI"}
                disabled={loadingUnbiased}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            <div className={`${isSingleColumn ? 'grid grid-cols-[2fr_1fr] gap-6 flex-1' : 'flex flex-col gap-2 sm:gap-4'} h-full`}>
              <div className="flex gap-2 sm:gap-4 items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors duration-300 min-h-[2.5rem]">
                    {loadingUnbiased ? (
                      <span className="flex flex-col items-start">
                        <span className="inline-flex items-center gap-2 my-2">
                          <span className="relative flex h-8 w-8">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-500">
                              <Sparkles className="h-6 w-6 m-1 text-white animate-spin" />
                            </span>
                          </span>
                          <span className="text-blue-500 font-medium text-base">Calling BiasBrief AI Agent…</span>
                        </span>
                      </span>
                    ) : displayTitle}
                  </h3>
                </div>
                {imageSource && !isSingleColumn && (
                  <div 
                    className="flex-shrink-0 rounded-md overflow-hidden shadow-sm"
                    style={{ 
                      width: imageSize,
                      height: imageSize
                    }}
                  >
                    <img
                      src={imageSource}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
              </div>

              {!isCompactLayout && (
                <div ref={contentRef} className="flex-grow">
                  <span
                    className="text-base text-gray-500 dark:text-gray-400"
                    dangerouslySetInnerHTML={{ __html: snippetText }}
                  />
                </div>
              )}

              {imageSource && isSingleColumn && (
                <div 
                  className="w-full max-w-md justify-self-end self-start rounded-md overflow-hidden shadow-sm"
                  style={{ 
                    width: 'auto',
                    height: `${Math.min(contentHeight * 1.5, 300)}px`,
                    minHeight: '200px'
                  }}
                >
                  <img
                    src={imageSource}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              )}
            </div>
          </CardHeader>

          {isCompactLayout && (
            <CardContent className="p-2 sm:p-4 pt-1 sm:pt-2 flex-grow">
              <span
                className="text-base text-gray-500 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: snippetText }}
              />
            </CardContent>
          )}
        </div>
        <CardFooter className="p-2 sm:p-4 pt-0 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col gap-0.5 text-sm mt-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">{article.source}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">{article.date}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBookmark(article.id);
            }}
            className={
                isBookmarked
                  ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
            }
          >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
