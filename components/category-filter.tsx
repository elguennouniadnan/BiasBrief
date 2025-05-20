"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getCategoryColor } from "@/lib/utils"
import { motion } from "framer-motion"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

export function CategoryFilter({ categories, selectedCategory, setSelectedCategory }: CategoryFilterProps) {
  return (
    <div className="bg-gray-50/60 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-300 dark:border-gray-800 py-1 sticky top-16 z-10 transition-colors duration-300 rounded-full mx-4">
      <div className="px-4 my-2 w-full">
        <ScrollArea className="w-full whitespace-nowrap overflow-hidden">
          <div className="flex space-x-1 py-1">
            {categories.map((category: string) => {
              const isSelected: boolean = selectedCategory === category
              const categoryColor: string | undefined = category !== "All" ? getCategoryColor(category) : undefined

              interface ButtonProps {
              key: string
              variant: "default" | "outline"
              size: "sm"
              onClick: () => void
              className: string
              style: React.CSSProperties
              children: React.ReactNode
              }

              interface MotionDivProps {
              layoutId: string
              className: string
              transition: {
                type: string
                bounce: number
                duration: number
              }
              }

              return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full relative overflow-hidden transition-all duration-300 ${
                isSelected ? "text-white" : "hover:text-primary"
                }`}
                style={
                isSelected && categoryColor ? { backgroundColor: categoryColor, borderColor: categoryColor } : {}
                }
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
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  )
}
