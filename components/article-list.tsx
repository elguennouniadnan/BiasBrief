"use client"

import React, { useState, useEffect } from "react"
import { ArticleCard } from "./article-card"
import { Article } from "@/lib/types"

interface ArticleListProps {
  articles: Article[]
  cardSize?: number
  isBiasedMode: boolean
  isBookmarked: (id: number) => boolean
  toggleBookmark: (id: number) => void
}

export function ArticleList({ articles, cardSize = 3, ...props }: ArticleListProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
  }[cardSize]

  return (
    <div className={`grid ${gridColumns} gap-4 py-4`}>
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          cardSize={cardSize}
          isBookmarked={props.isBookmarked(article.id)}
          isBiasedMode={props.isBiasedMode}
          toggleBookmark={props.toggleBookmark}
        />
      ))}
    </div>
  )
}
