import { ArticleCard } from "@/components/article-card"
import type { Article } from "@/lib/types"

interface ArticleListProps {
  articles: Article[]
  isBiasedMode: boolean
  bookmarks: number[]
  toggleBookmark: (id: number) => void
}

export function ArticleList({ articles, isBiasedMode, bookmarks, toggleBookmark }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">No articles found</h2>
        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isBiasedMode={isBiasedMode}
          isBookmarked={bookmarks.includes(article.id)}
          toggleBookmark={toggleBookmark}
        />
      ))}
    </div>
  )
}
