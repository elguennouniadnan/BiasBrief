"use client"

import React, { useState, useEffect } from "react"
import { ArticleCard } from "./article-card"
import { Article } from "@/lib/types"

interface ArticleListProps {
  articles: Article[]
  cardSize?: number
  isBookmarked: (id: number) => boolean
  toggleBookmark: (id: number) => void
}

export function ArticleList({ articles, cardSize = 3, ...props }: ArticleListProps) {
  // Only display articles with a proper image
  const hasImage = (article: Article) => {
    if (article.imageHtml) {
      // Check if imageHtml contains an <img src=...> with a non-placeholder src
      const match = article.imageHtml.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (match && match[1] && !match[1].includes('placeholder')) return true
    }
    if (article.imageUrl && !article.imageUrl.includes('placeholder')) return true
    if (article.image && !article.image.includes('placeholder')) return true
    return false
  }
  const filteredArticles = articles.filter(hasImage)

  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
  }[cardSize]

  return (
    <div className={`grid ${gridColumns} gap-4 py-4`}>
      {filteredArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          cardSize={cardSize}
          isBookmarked={props.isBookmarked(article.id)}
          toggleBookmark={props.toggleBookmark}
        />
      ))}
    </div>
  )
}
