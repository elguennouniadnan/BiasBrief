"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getCategoryColor } from "@/lib/utils"
import { motion } from "framer-motion"
import React, { useRef, useEffect } from "react"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

export function CategoryFilter({ categories, selectedCategory, setSelectedCategory }: CategoryFilterProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)

  // Scroll selected category into view when it changes
  useEffect(() => {
    const selectedIdx = categories.findIndex((cat) => cat === selectedCategory)
    const btn = buttonRefs.current[selectedIdx]
    if (btn && scrollAreaRef.current) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }
  }, [selectedCategory, categories])

  return (
    <div className="bg-gray-50/60 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-300 dark:border-gray-800 sticky top-16 z-10 pt-0.5 transition-colors duration-300 rounded-full mx-4">
      <div className="px-4 my-1 w-full">
        <ScrollArea className="w-full whitespace-nowrap overflow-x-auto" ref={scrollAreaRef}>
          <div className="flex space-x-1 py-2">
            {categories.map((category: string, idx: number) => {
              const isSelected: boolean = selectedCategory === category
              const categoryColor: string | undefined = category !== "All" ? getCategoryColor(category) : undefined

              return (
                <Button
                  key={category}
                  ref={el => { buttonRefs.current[idx] = el || null } }
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full relative overflow-hidden transition-all duration-300 ${
                    isSelected ? "text-white" : "hover:text-primary"
                  } focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-20`}
                  style={
                    isSelected && categoryColor ? { backgroundColor: categoryColor, borderColor: categoryColor } : {}
                  }
                  tabIndex={0}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="categoryBubble"
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {category}
                </Button>
              )
            })}
          </div>
          {/* Show a subtle fade on the right to indicate scrollability */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-50/80 dark:from-gray-900/90 to-transparent" style={{zIndex: 1}} />
          <ScrollBar orientation="horizontal" className="opacity-60 hover:opacity-100 transition-opacity duration-200 h-2.5 pt-0.5 px-2" />
        </ScrollArea>
      </div>
    </div>
  )
}
