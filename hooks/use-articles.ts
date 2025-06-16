/**
 * Custom hook for article management operations
 */

import { useState, useEffect, useMemo } from "react";
import { Article, SortOrder } from "@/lib/types";
import { trackEvents } from "@/lib/analytics";
import { storageService } from "@/lib/storage-service";

interface UseArticlesProps {
  initialSearchQuery?: string;
  initialCategory?: string;
  initialShowBookmarksOnly?: boolean;
  initialPreferredCategories?: string[];
  initialSortOrder?: SortOrder;
  articlesPerPage?: number;
}

interface UseArticlesReturn {
  articles: Article[];
  filteredArticles: Article[];
  categories: string[];
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  bookmarks: number[];
  selectedCategory: string;
  searchQuery: string;
  showBookmarksOnly: boolean;
  preferredCategories: string[];
  sortOrder: SortOrder;
  handleSearch: (query: string) => void;
  handleCategoryChange: (category: string) => void;
  toggleBookmark: (articleId: number) => void;
  setShowBookmarksOnly: (show: boolean) => void;
  setPreferredCategories: (categories: string[]) => void;
  setCurrentPage: (page: number) => void;
  setSortOrder: (order: SortOrder) => void;
  refreshArticles: () => Promise<void>;
}

/**
 * Hook for managing article operations
 */
export function useArticles({
  initialSearchQuery = "",
  initialCategory = "All",
  initialShowBookmarksOnly = false,
  initialPreferredCategories = [],
  initialSortOrder = 'new-to-old',
  articlesPerPage = 9,
}: UseArticlesProps = {}): UseArticlesReturn {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(initialShowBookmarksOnly);
  const [preferredCategories, setPreferredCategories] = useState<string[]>(initialPreferredCategories);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load bookmarks from localStorage
  useEffect(() => {
    if (mounted) {
      const result = storageService.getBookmarks();
      if (result.success && result.data) {
        // Convert string[] to number[] if needed
        setBookmarks((result.data as string[]).map(Number));
      }
    }
  }, [mounted]);

  // Save bookmarks to localStorage when they change
  useEffect(() => {
    if (mounted) {
      // Convert number[] to string[] for storage
      storageService.saveBookmarks(bookmarks.map(String));
    }
  }, [bookmarks, mounted]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, showBookmarksOnly, preferredCategories]);

  /**
   * Toggle bookmark status for an article
   */
  const toggleBookmark = (articleId: number) => {
    const isCurrentlyBookmarked = bookmarks.includes(articleId);
    const newBookmarks = isCurrentlyBookmarked
      ? bookmarks.filter((id) => id !== articleId)
      : [...bookmarks, articleId];
    setBookmarks(newBookmarks);
    // Use the standardized bookmark tracking method
    if (isCurrentlyBookmarked) {
      trackEvents.unbookmarkArticle(String(articleId));
    } else {
      trackEvents.bookmarkArticle(String(articleId));
    }
  };

  /**
   * Handle category selection change
   */
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    trackEvents.categorySelect(category);
  };

  /**
   * Handle search query change
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      trackEvents.search(query);
    }
  };

  /**
   * Fetch articles from API
   */
  const refreshArticles = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      
      const response = await fetch(`/api/news?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      
      const data = await response.json();
      
      if (data.articles) {
        setAllArticles(data.articles);
        storageService.saveArticles(data.articles);
        
        if (data.categories) {
          setCategories(['All', ...data.categories]);
        }
      }
      
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch articles when component mounts or when search query changes
  useEffect(() => {
    if (mounted) {
      const articlesResult = storageService.getArticles();
      const hasStoredArticles = articlesResult.success && articlesResult.data && articlesResult.data.length > 0;
      
      if (!hasStoredArticles || searchQuery) {
        refreshArticles();
      } else {
        setAllArticles(articlesResult.data || []);
        
        // Set categories from saved articles
        const articleSections = articlesResult.data?.map(a => a.section) || [];
        const uniqueSections = Array.from(new Set(articleSections));
        setCategories(['All', ...uniqueSections]);
        
        setIsLoading(false);
      }
    }
  }, [mounted, searchQuery]);

  // Filter and paginate articles
  const { filteredArticles, totalPages } = useMemo(() => {
    // Apply all filters
    let filtered = allArticles.filter((article) => {
      const matchesCategory = selectedCategory === "All" || article.section === selectedCategory;
      const matchesPreferences = preferredCategories.length === 0 || 
        (article.category && preferredCategories.includes(article.category));
      // Convert article.id to number for bookmarks.includes
      const matchesBookmarks = !showBookmarksOnly || bookmarks.includes(Number(article.id));
      return matchesCategory && matchesPreferences && matchesBookmarks;
    });

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'new-to-old' ? dateB - dateA : dateA - dateB;
    });

    // Calculate pagination
    const total = Math.ceil(filtered.length / articlesPerPage);
    const start = (currentPage - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const paginatedArticles = filtered.slice(start, end);

    return {
      filteredArticles: paginatedArticles,
      totalPages: total || 1 // Ensure there's at least one page
    };
  }, [
    allArticles, 
    selectedCategory, 
    preferredCategories, 
    showBookmarksOnly, 
    bookmarks, 
    currentPage, 
    articlesPerPage, 
    sortOrder
  ]);

  return {
    articles: allArticles,
    filteredArticles,
    categories,
    currentPage,
    totalPages,
    isLoading,
    bookmarks,
    selectedCategory,
    searchQuery,
    showBookmarksOnly,
    preferredCategories,
    sortOrder,
    handleSearch,
    handleCategoryChange,
    toggleBookmark,
    setShowBookmarksOnly,
    setPreferredCategories,
    setCurrentPage,
    setSortOrder,
    refreshArticles
  };
}