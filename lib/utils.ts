import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//this function should return a color even if the category is not in the list
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "All": "#9ca3af",               // neutral gray
    "Technology": "#8b5cf6",        // violet
    "test": "#6b7280",              // gray (fallback/test)
    "Australia news": "#1e88e5",    // blue
    "Sport": "#f44336",             // red
    "Football": "#d32f2f",          // darker red
    "Society": "#43a047",           // green
    "Politics": "#3b82f6",          // blue
    "US news": "#0d47a1",           // deep blue
    "World news": "#6366f1",        // indigo
    "Business": "#ff5722",          // deep orange
    "Education": "#3f51b5",         // indigo
    "Books": "#6d4c41",             // brown
    "Crosswords": "#546e7a",        // blue gray
    "Opinion": "#ff9800",           // orange
    "Life and style": "#4caf50",    // green
    "UK news": "#1e3a8a",           // navy
    "Stage": "#ab47bc",             // purple
    "Music": "#ec407a",             // pink
    "Media": "#00838f",             // teal
    "Global development": "#00695c",// teal dark
    "Culture": "#e91e63",           // pink
    "Environment": "#2e7d32",       // green dark
    "News": "#2196f3",              // blue
    "Television & radio": "#f06292",// pink light
    "Law": "#5e35b1",               // deep purple
    "Travel": "#00acc1",            // cyan
    "Money": "#2e7d32",             // green dark
    "Food": "#ff7043",              // orange
    "The Filter": "#455a64",        // blue gray
    "Art and design": "#9c27b0",    // purple
  };

  return colors[category] || "#6b7280"; // default gray
}


export function getReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}
