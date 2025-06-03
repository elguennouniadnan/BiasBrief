// grid-article-card.tsx
"use client"

import { Bookmark } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"
import { formatDateInUserTimezone } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

interface GridArticleCardProps {
  article: Article
  isBiasedMode: boolean
  isBookmarked: boolean
  toggleBookmark: (id: string) => void
  variant: "hero" | "title-only" | "image-overlay" | "horizontal" | "large" | "vertical"
}

export function GridArticleCard({
  article,
  isBiasedMode,
  isBookmarked,
  toggleBookmark,
  variant,
}: GridArticleCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [titleFontSize, setTitleFontSize] = useState("1rem")

  // Always use a string fallback for title
  const title = (isBiasedMode ? article.titleBiased : article.titleUnbiased) || article.titleBiased || article.titleUnbiased || "Untitled"

  useEffect(() => {
    if (
      (variant === "title-only" || variant === "image-overlay" || variant === "horizontal" || variant === "vertical") &&
      titleRef.current &&
      containerRef.current &&
      title
    ) {
      const adjustTitleSize = () => {
        const titleElement = titleRef.current!
        const containerElement = containerRef.current!
        titleElement.style.fontSize = ""
        const containerHeight = containerElement.clientHeight
        const containerWidth = containerElement.clientWidth
        const titleLength = title.length
        let fontSize = Math.min(
          Math.max(containerWidth / (titleLength * 0.6), 10),
          Math.min(containerHeight / 4, 24),
        )
        if (variant === "title-only") {
          fontSize = Math.min(fontSize * 1.3, 20)
        } else if (variant === "image-overlay") {
          fontSize = Math.min(fontSize * 1.1, 20)
        } else if (variant === "horizontal") {
          fontSize = Math.min(fontSize * 0.9, 16)
        } else if (variant === "vertical") {
          fontSize = Math.min(fontSize * 1.0, 16)
        }
        setTitleFontSize(`${fontSize}px`)
        titleElement.style.fontSize = `${fontSize}px`
        let attempts = 0
        while (titleElement.scrollHeight > containerElement.clientHeight && fontSize > 10 && attempts < 10) {
          fontSize *= 0.9
          titleElement.style.fontSize = `${fontSize}px`
          setTitleFontSize(`${fontSize}px`)
          attempts++
        }
      }
      adjustTitleSize()
      window.addEventListener("resize", adjustTitleSize)
      return () => {
        window.removeEventListener("resize", adjustTitleSize)
      }
    }
  }, [title, variant])

  if (!article) return null

  if (variant === "hero") {
    return (
      <Card className="h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <Link href={`/article/${article.id}`} className="block h-full">
          {article.imageUrl && (
            <div className="absolute inset-0">
              <img
                src={article.imageUrl || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
              />
              {/* <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" /> */}
            </div>
          )}

          <div className="absolute bottom-0 left-0 w-full flex flex-col justify-end items-baseline px-5 py-7" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 98.5%, rgba(0,0,0,0.0) 100%)' }}>
            <h2 className="text-white font-bold text-xl lg:text-2xl leading-tight mb-3 transition-colors">
              {title}
            </h2>
            <p className="text-gray-200 text-sm lg:text-base mb-4 line-clamp-3 overflow-hidden text-ellipsis">
              {article.snippet}
            </p>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === "title-only") {
    return (
      <Card className="h-full min-h-[160px] lg:max-h-[180px] flex flex-row group hover:shadow-md transition-all duration-300  bg-gradient-to-br from-gray-50/40 via-[#f0f4ff]/30 to-[#e6fff9]/20 dark:from-blue-950/5 dark:via-blue-950/10 dark:to-blue-950/30 dark:bg-gradient-to-br relative overflow-hidden">
        <Link href={`/article/${article.id}`} className="flex flex-1 flex-row justify-center relative z-5">
          <div ref={containerRef} className="flex flex-col items-center justify-center">
            <h3
              ref={titleRef}
              className="font-bold leading-tight transition-colors w-full px-2"
              style={{ fontSize: titleFontSize }}
            >
              {title}
            </h3>
            <p
              className="leading-tight text-xs transition-colors w-full px-2 pt-2 line-clamp-2 overflow-hidden text-ellipsis"
              dangerouslySetInnerHTML={{ __html: article.snippet || "" }}
            />
          </div>
          {article.imageUrl && (
            <div className="w-44 min-w-[9rem] lg:w-40 flex-shrink-0 flex items-center justify-center overflow-hidden mr-1" >
              <div className="rounded-sm p-1">  
                <img
                    src={article.imageUrl || "/placeholder.svg"}
                    alt=""
                    className="w-full object-contain pointer-events-none select-none transition-transform duration-500 group-hover:scale-105"
                    style={{ zIndex: 0, borderRadius: '0.5rem' }}
                />
              </div>
            </div>
          )}
        </Link>
      </Card>
    )
  }

  if (variant === "image-overlay") {
    return (
      <Card className="h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <Link href={`/article/${article.id}`} className="block h-full">
          {article.imageUrl && (
            <div className="absolute inset-0">
              <img
                src={article.imageUrl || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}
          <div ref={containerRef} className="relative z-10 h-full flex flex-col justify-center p-4">
            <h3
              ref={titleRef}
              className="text-white font-bold leading-tight group-hover:text-gray-200 transition-colors"
              style={{ fontSize: titleFontSize }}
            >
              {title}
            </h3>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === "horizontal") {
    return (
      <Card className="h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <Link href={`/article/${article.id}`} className="block h-full">
          {article.imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#fffbe6] via-[#f0f4ff] to-[#e6fff9] dark:from-blue-950/20 dark:via-blue-950/30 dark:to-blue-950/60 dark:bg-gradient-to-br">
              <img
                src={article.imageUrl || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="absolute bottom-0 left-0 w-full flex flex-col justify-end items-baseline px-5 py-7" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 98.5%, rgba(0,0,0,0.0) 100%)' }}>
            <h2 className="text-white font-bold text-xl lg:text-2xl leading-tight mb-3 transition-colors">
              {title}
            </h2>
            <p className="text-gray-200 text-sm lg:text-base mb-3 line-clamp-3 overflow-hidden text-ellipsis">
              {article.snippet}
            </p>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === "large") {
    return (
      <Card className="h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <Link href={`/article/${article.id}`} className="block h-full">
          {article.imageUrl && (
            <div className="absolute inset-0">
              <img
                src={article.imageUrl || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            </div>
          )}
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <h2 className="text-white font-bold text-lg lg:text-xl leading-tight mb-3 group-hover:text-gray-200 transition-colors">
              {title}
            </h2>
            <p className="text-gray-200 text-sm lg:text-base line-clamp-3 overflow-hidden text-ellipsis">
              {article.snippet}
            </p>
          </div>
        </Link>
      </Card>
    )
  }

  if (variant === "vertical") {
    return (
      <Card className="h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <Link href={`/article/${article.id}`} className="block h-full">
          {article.imageUrl && (
            <div className="absolute inset-0">
              <img
                src={article.imageUrl || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
          )}
          <div ref={containerRef} className="relative z-10 h-full flex flex-col justify-end">
            <div className="relative z-10 h-full flex flex-col justify-end p-4">
                <h2 className="text-white font-bold lg:text-lg leading-tight mb-3 group-hover:text-gray-200 transition-colors">
                {title}
                </h2>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  return null
}
