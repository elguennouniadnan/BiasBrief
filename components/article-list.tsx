"use client"

import React, { useState, useEffect } from "react"
import { ArticleCard } from "./article-card"
import { Article } from "@/lib/types"

interface ArticleListProps {
  articles: Article[]
  cardSize?: number
  isBookmarked: (id: string) => boolean
  toggleBookmark: (id: string) => void
  onUnbiasTitle?: (id: string, unbiasedTitle: string) => void // new prop
}

export function ArticleList({ articles, ...props }: ArticleListProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4">
      {filteredArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          cardSize={3} // Default to 3 for consistent card layout
          isBookmarked={props.isBookmarked(article.id)}
          toggleBookmark={props.toggleBookmark}
          onUnbiasTitle={props.onUnbiasTitle}
        />
      ))}
    </div>
  )
}
