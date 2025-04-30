"use client"

import { Bookmark } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { getCategoryColor } from "@/lib/utils"

interface ArticleCardProps {
  article: Article
  isBiasedMode: boolean
  isBookmarked: boolean
  toggleBookmark: (id: number) => void
}

export function ArticleCard({ article, isBiasedMode, isBookmarked, toggleBookmark }: ArticleCardProps) {
  const title = isBiasedMode ? article.titleBiased : article.titleUnbiased
  const categoryColor = getCategoryColor(article.category)

  return (
    <Card
      className="overflow-hidden h-full flex flex-col group hover:shadow-md transition-all duration-300 border-t-2 hover:-translate-y-1"
      style={{ borderTopColor: categoryColor }}
    >
      <Link href={`/article/${article.id}`} className="flex-grow flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <CardHeader className="p-4 pb-2 flex flex-col gap-4">
          <Badge
            variant="outline"
            className="self-start mb-1 font-medium transition-colors duration-300"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
              borderColor: `${categoryColor}30`,
            }}
          >
            {article.category}
          </Badge>

          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors duration-300">
                {title}
              </h3>
            </div>
            {article.imageUrl && (
              <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden shadow-sm">
                <img
                  src={article.imageUrl || "/placeholder.svg"}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex-grow">
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{article.snippet}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{article.source}</span>
          <span className="text-gray-500 dark:text-gray-400">{formatDate(article.date)}</span>
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
              : "text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }
        >
          <Bookmark
            className={`h-5 w-5 transition-all duration-300 ${isBookmarked ? "scale-110" : "scale-100"}`}
            fill={isBookmarked ? "currentColor" : "none"}
          />
          <span className="sr-only">{isBookmarked ? "Remove bookmark" : "Add bookmark"}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
