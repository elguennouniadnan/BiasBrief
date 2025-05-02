import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }
  return date.toLocaleDateString(undefined, options)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    News: "#2196f3", // blue
    Opinion: "#ff9800", // orange
    Sport: "#f44336", // red
    Culture: "#e91e63", // pink
    Lifestyle: "#4caf50", // green
    Arts: "#9c27b0", // purple
    // Fallbacks for section names if pillar name is not available
    Politics: "#3b82f6",
    Technology: "#8b5cf6",
    Health: "#10b981",
    Entertainment: "#f59e0b",
    "World News": "#6366f1",
  }

  return colors[category] || "#6b7280" // gray as default
}

export function getReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}
