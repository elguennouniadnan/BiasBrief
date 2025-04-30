import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString(undefined, options)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Politics: "#3b82f6", // blue
    Technology: "#8b5cf6", // violet
    Health: "#10b981", // emerald
    Sports: "#ef4444", // red
    Entertainment: "#f59e0b", // amber
    "World News": "#6366f1", // indigo
  }

  return colors[category] || "#6b7280" // gray as default
}

export function getReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}
