/**
 * Custom hook for managing user preferences
 * Enhanced with strong typing and proper error handling
 */

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { storageService } from '@/lib/storage-service';
import { trackEvents } from '@/lib/analytics';
import { UserPreferences, FontSize, ThemeOption } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface UsePreferencesProps {
  initialFontSize?: FontSize;
  initialCardSize?: number;
  initialArticlesPerPage?: number;
  initialDefaultBiasMode?: boolean;
}

interface UsePreferencesReturn {
  themePreference: boolean;
  defaultBiasMode: boolean;
  isBiasedMode: boolean;
  fontSize: FontSize;
  cardSize: number;
  articlesPerPage: number;
  preferredCategories: string[];
  bookmarks: string[];
  isLoading: boolean;
  toggleTheme: () => void;
  setDefaultBiasMode: (value: boolean) => void; 
  setIsBiasedMode: (value: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setCardSize: (size: number) => void;
  setArticlesPerPage: (count: number) => void;
  setPreferredCategories: (categories: string[]) => void;
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  saveAllPreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

/**
 * Hook for managing user preferences with localStorage persistence
 * Follows Agile best practices with proper error handling and typed returns
 */
export function usePreferences({
  initialFontSize = 'medium',
  initialCardSize = 3,
  initialArticlesPerPage = 15,
  initialDefaultBiasMode = false
}: UsePreferencesProps = {}): UsePreferencesReturn {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // User preferences state
  const [themePreference, setThemePreference] = useState(false);
  const [defaultBiasMode, setDefaultBiasMode] = useState(initialDefaultBiasMode);
  const [isBiasedMode, setIsBiasedMode] = useState(initialDefaultBiasMode);
  const [fontSize, setFontSize] = useState<FontSize>(initialFontSize);
  const [cardSize, setCardSize] = useState(initialCardSize);
  const [articlesPerPage, setArticlesPerPage] = useState(initialArticlesPerPage);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Handle storage errors
  const handleStorageError = (error: Error | undefined, fallbackMessage: string) => {
    console.error(fallbackMessage, error);
    toast({
      title: "Preferences Error",
      description: `Failed to save your preferences. ${error?.message || fallbackMessage}`,
      variant: "destructive",
    });
  };

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize preferences from localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      // Try to load all preferences at once first
      const allPrefsResult = storageService.getAllPreferences();
      
      if (allPrefsResult.success && allPrefsResult.data) {
        // If successful, set all preferences
        const prefs = allPrefsResult.data;
        
        setTheme(prefs.theme);
        setThemePreference(prefs.theme === 'dark');
        setDefaultBiasMode(prefs.defaultBiasMode);
        setIsBiasedMode(prefs.defaultBiasMode);
        setFontSize(prefs.fontSize);
        setCardSize(prefs.cardSize);
        setArticlesPerPage(prefs.articlesPerPage);
        setPreferredCategories(prefs.preferredCategories);
        setBookmarks(prefs.bookmarks);
      } else {
        // Fallback to individual preference retrieval
        console.warn('Failed to load all preferences, falling back to individual retrieval');
        
        // Theme
        const themeResult = storageService.getThemePreference();
        if (themeResult.success && themeResult.data) {
          setTheme(themeResult.data);
          setThemePreference(themeResult.data === 'dark');
        }

        // Bias mode
        const biasModeResult = storageService.getDefaultBiasMode();
        if (biasModeResult.success) {
          const biasMode = biasModeResult.data ?? initialDefaultBiasMode;
          setDefaultBiasMode(biasMode);
          setIsBiasedMode(biasMode);
        }

        // Font size
        const fontSizeResult = storageService.getFontSize();
        if (fontSizeResult.success && fontSizeResult.data) {
          setFontSize(fontSizeResult.data);
        }

        // Card size
        const cardSizeResult = storageService.getCardSize();
        if (cardSizeResult.success && cardSizeResult.data !== undefined) {
          setCardSize(cardSizeResult.data);
        }

        // Articles per page
        const articlesPerPageResult = storageService.getArticlesPerPage();
        if (articlesPerPageResult.success && articlesPerPageResult.data !== undefined) {
          setArticlesPerPage(articlesPerPageResult.data);
        }

        // Preferred categories
        const categoriesResult = storageService.getPreferredCategories();
        if (categoriesResult.success && categoriesResult.data) {
          setPreferredCategories(categoriesResult.data);
        }
        
        // Bookmarks
        const bookmarksResult = storageService.getBookmarks();
        if (bookmarksResult.success && bookmarksResult.data) {
          setBookmarks(bookmarksResult.data);
        }
      }
      
      setIsLoading(false);
    }
  }, [mounted, theme, setTheme, initialDefaultBiasMode, initialFontSize, initialArticlesPerPage, initialCardSize]);

  // Update theme preference when theme changes
  useEffect(() => {
    if (mounted) {
      setThemePreference(theme === 'dark');
    }
  }, [theme, mounted]);

  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const result = storageService.saveThemePreference(newTheme as ThemeOption);
    
    if (result.success) {
      trackEvents.toggleTheme(newTheme);
    } else {
      handleStorageError(result.error, 'Failed to save theme preference');
    }
  };

  // Update default bias mode
  const updateDefaultBiasMode = (value: boolean) => {
    setDefaultBiasMode(value);
    const result = storageService.saveDefaultBiasMode(value);
    
    if (result.success) {
      trackEvents.setDefaultBiasMode(value);
    } else {
      handleStorageError(result.error, 'Failed to save bias mode preference');
    }
  };

  // Update bias mode (temporary session state, not persisted)
  const updateBiasMode = (value: boolean) => {
    setIsBiasedMode(value);
    trackEvents.toggleBiasMode(value);
  };

  // Update font size
  const updateFontSize = (size: FontSize) => {
    setFontSize(size);
    const result = storageService.saveFontSize(size);
    
    if (result.success) {
      trackEvents.setFontSize(size);
    } else {
      handleStorageError(result.error, 'Failed to save font size preference');
    }
  };

  // Update card size
  const updateCardSize = (size: number) => {
    setCardSize(size);
    const result = storageService.saveCardSize(size);
    
    if (result.success) {
      trackEvents.setLayoutOption('cardSize', size.toString());
    } else {
      handleStorageError(result.error, 'Failed to save card size preference');
    }
  };

  // Update articles per page
  const updateArticlesPerPage = (count: number) => {
    setArticlesPerPage(count);
    const result = storageService.saveArticlesPerPage(count);
    
    if (result.success) {
      trackEvents.setLayoutOption('articlesPerPage', count.toString());
    } else {
      handleStorageError(result.error, 'Failed to save articles per page preference');
    }
  };

  // Update preferred categories
  const updatePreferredCategories = (categories: string[]) => {
    setPreferredCategories(categories);
    const result = storageService.savePreferredCategories(categories);
    
    if (result.success) {
      trackEvents.setPreferredCategories(categories);
    } else {
      handleStorageError(result.error, 'Failed to save category preferences');
    }
  };
  
  // Add bookmark
  const addBookmark = (articleId: string) => {
    const result = storageService.addBookmark(articleId);
    
    if (result.success) {
      // Only update state if the article isn't already bookmarked
      if (!bookmarks.includes(articleId)) {
        const updatedBookmarks = [...bookmarks, articleId];
        setBookmarks(updatedBookmarks);
        trackEvents.bookmarkArticle(articleId);
      }
    } else {
      handleStorageError(result.error, 'Failed to bookmark article');
    }
  };
  
  // Remove bookmark
  const removeBookmark = (articleId: string) => {
    const result = storageService.removeBookmark(articleId);
    
    if (result.success) {
      const updatedBookmarks = bookmarks.filter(id => id !== articleId);
      setBookmarks(updatedBookmarks);
      trackEvents.unbookmarkArticle(articleId);
    } else {
      handleStorageError(result.error, 'Failed to remove bookmark');
    }
  };
  
  // Check if article is bookmarked
  const isBookmarked = (articleId: string): boolean => {
    return bookmarks.includes(articleId);
  };
  
  // Save all preferences in a batch
  const saveAllPreferences = (preferences: Partial<UserPreferences>) => {
    // Create a merged preferences object with current state
    const currentPreferences: UserPreferences = {
      theme: theme as ThemeOption,
      defaultBiasMode,
      fontSize,
      cardSize,
      articlesPerPage,
      preferredCategories,
      bookmarks
    };
    
    const mergedPreferences = { ...currentPreferences, ...preferences };
    
    // Save all preferences at once
    const result = storageService.saveAllPreferences(mergedPreferences);
    
    if (result.success) {
      // Update local state with new preferences
      if (preferences.theme) setTheme(preferences.theme);
      if (preferences.defaultBiasMode !== undefined) {
        setDefaultBiasMode(preferences.defaultBiasMode);
        setIsBiasedMode(preferences.defaultBiasMode);
      }
      if (preferences.fontSize) setFontSize(preferences.fontSize);
      if (preferences.cardSize !== undefined) setCardSize(preferences.cardSize);
      if (preferences.articlesPerPage !== undefined) setArticlesPerPage(preferences.articlesPerPage);
      if (preferences.preferredCategories) setPreferredCategories(preferences.preferredCategories);
      if (preferences.bookmarks) setBookmarks(preferences.bookmarks);
      
      // Track analytics for batch update
      trackEvents.batchUpdatePreferences(Object.keys(preferences));
      
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully."
      });
    } else {
      handleStorageError(result.error, 'Failed to save preferences');
    }
  };
  
  // Reset all preferences to defaults
  const resetPreferences = () => {
    const defaultPreferences: UserPreferences = {
      theme: 'light',
      defaultBiasMode: false,
      fontSize: 'medium',
      cardSize: 3,
      articlesPerPage: 15,
      preferredCategories: [],
      bookmarks: []
    };
    
    saveAllPreferences(defaultPreferences);
    trackEvents.resetPreferences();
  };

  return {
    themePreference,
    defaultBiasMode,
    isBiasedMode,
    fontSize,
    cardSize,
    articlesPerPage,
    preferredCategories,
    bookmarks,
    isLoading,
    toggleTheme,
    setDefaultBiasMode: updateDefaultBiasMode,
    setIsBiasedMode: updateBiasMode,
    setFontSize: updateFontSize,
    setCardSize: updateCardSize,
    setArticlesPerPage: updateArticlesPerPage,
    setPreferredCategories: updatePreferredCategories,
    addBookmark,
    removeBookmark,
    isBookmarked,
    saveAllPreferences,
    resetPreferences
  };
}