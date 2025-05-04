"use client"

import { Bookmark } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { getCategoryColor } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface ArticleCardProps {
  article: Article
  isBiasedMode: boolean
  isBookmarked: boolean
  toggleBookmark: (id: number) => void
  cardSize: number
}

export function ArticleCard({ article, isBiasedMode, isBookmarked, toggleBookmark, cardSize }: ArticleCardProps) {
  // Use fallback pattern for title - use the available title based on the mode or default to the main title
  const displayTitle = isBiasedMode 
    ? (article.titleBiased || article.title) 
    : (article.titleUnbiased || article.title);
    
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

  return (
    <Card
      className="overflow-hidden h-full flex flex-col group hover:shadow-md transition-all duration-300 border-t-2 hover:-translate-y-1"
      style={{ borderTopColor: categoryColor }}
    >
      <Link href={`/article/${article.id}`} className="flex-grow flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <CardHeader className={`p-2 sm:p-4 pb-1 sm:pb-2 flex flex-col gap-2 sm:gap-4 ${isSingleColumn ? 'flex-1' : ''}`}>
          <Badge
            variant="outline"
            className="self-start mb-0.5 sm:mb-1 font-medium transition-colors duration-300"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
              borderColor: `${categoryColor}30`,
            }}
          >
            {article.category || article.section}
          </Badge>

          <div className={`${isSingleColumn ? 'grid grid-cols-[2fr_1fr] gap-6 flex-1' : 'flex flex-col gap-2 sm:gap-4'} h-full`}>
            <div className="flex gap-2 sm:gap-4 items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors duration-300">
                  {displayTitle}
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
                <p className="text-base text-gray-500 dark:text-gray-400">
                  {snippetText}
                </p>
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
            <p className="text-base text-gray-500 dark:text-gray-400">
              {snippetText}
            </p>
          </CardContent>
        )}
      </Link>
      <CardFooter className="p-2 sm:p-4 pt-0 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col gap-0.5 text-sm mt-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">{article.source}</span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDate(article.date)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            toggleBookmark(article.id)
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
  )
}
