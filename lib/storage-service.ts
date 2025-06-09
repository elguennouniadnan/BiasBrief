/**
 * Storage service for managing browser localStorage
 * 
 * Follows the repository pattern to centralize all storage operations
 * and provide type-safety and error handling
 */

import { UserPreferences, Article, User, StorageResult, ThemeOption, FontSize, ReadingHistoryItem } from './types';

// Storage keys
const STORAGE_KEYS = {
  THEME: 'bias-brief-theme',
  DEFAULT_BIAS_MODE: 'bias-brief-default-bias-mode',
  FONT_SIZE: 'bias-brief-font-size',
  CARD_SIZE: 'bias-brief-card-size',
  ARTICLES_PER_PAGE: 'bias-brief-articles-per-page',
  PREFERRED_CATEGORIES: 'bias-brief-preferred-categories',
  BOOKMARKS: 'bias-brief-bookmarks',
  AUTH_TOKEN: 'bias-brief-auth-token',
  USER_DATA: 'bias-brief-user-data',
  LAST_VISITED: 'bias-brief-last-visited',
  READING_HISTORY: 'bias-brief-reading-history',
  SYNC_TIMESTAMP: 'bias-brief-sync-timestamp',
  ARTICLES: 'bias-brief-articles',
};

// Default values
const DEFAULTS = {
  THEME: 'light' as ThemeOption,
  DEFAULT_BIAS_MODE: false,
  FONT_SIZE: 'medium' as FontSize,
  CARD_SIZE: 3,
  ARTICLES_PER_PAGE: 15,
  PREFERRED_CATEGORIES: [] as string[],
  BOOKMARKS: [] as string[],
};

/**
 * Safe localStorage wrapper with error handling
 */
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
      return false;
    }
  }
};

/**
 * Storage service implementation
 */
class StorageService {
  /**
   * Get theme preference
   */
  getThemePreference(): StorageResult<ThemeOption> {
    try {
      const theme = safeStorage.getItem(STORAGE_KEYS.THEME);
      const validTheme = (theme === 'dark' || theme === 'light') ? theme : DEFAULTS.THEME;
      return { success: true, data: validTheme };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save theme preference
   */
  saveThemePreference(theme: ThemeOption): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.THEME, theme);
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get default bias mode setting
   */
  getDefaultBiasMode(): StorageResult<boolean> {
    try {
      const mode = safeStorage.getItem(STORAGE_KEYS.DEFAULT_BIAS_MODE);
      return { success: true, data: mode === 'true' ? true : DEFAULTS.DEFAULT_BIAS_MODE };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save default bias mode setting
   */
  saveDefaultBiasMode(mode: boolean): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.DEFAULT_BIAS_MODE, mode.toString());
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get font size preference
   */
  getFontSize(): StorageResult<FontSize> {
    try {
      const size = safeStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      const validSize = (size === 'small' || size === 'medium' || size === 'large') ? size : DEFAULTS.FONT_SIZE;
      return { success: true, data: validSize as FontSize };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save font size preference
   */
  saveFontSize(size: FontSize): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get card size preference
   */
  getCardSize(): StorageResult<number> {
    try {
      const size = safeStorage.getItem(STORAGE_KEYS.CARD_SIZE);
      const parsedSize = size ? parseInt(size, 10) : DEFAULTS.CARD_SIZE;
      return { success: true, data: parsedSize };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save card size preference
   */
  saveCardSize(size: number): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.CARD_SIZE, size.toString());
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get articles per page preference
   */
  getArticlesPerPage(): StorageResult<number> {
    try {
      const count = safeStorage.getItem(STORAGE_KEYS.ARTICLES_PER_PAGE);
      const parsedCount = count ? parseInt(count, 10) : DEFAULTS.ARTICLES_PER_PAGE;
      return { success: true, data: parsedCount };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save articles per page preference
   */
  saveArticlesPerPage(count: number): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.ARTICLES_PER_PAGE, count.toString());
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get preferred categories
   */
  getPreferredCategories(): StorageResult<string[]> {
    try {
      const categories = safeStorage.getItem(STORAGE_KEYS.PREFERRED_CATEGORIES);
      if (!categories) return { success: true, data: DEFAULTS.PREFERRED_CATEGORIES };
      
      const parsedCategories = JSON.parse(categories);
      return { success: true, data: parsedCategories };
    } catch (error) {
      console.error('Error parsing preferred categories', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)),
        data: DEFAULTS.PREFERRED_CATEGORIES 
      };
    }
  }

  /**
   * Save preferred categories
   */
  savePreferredCategories(categories: string[]): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.PREFERRED_CATEGORIES, JSON.stringify(categories));
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get bookmarked articles
   */
  getBookmarks(): StorageResult<string[]> {
    try {
      const bookmarks = safeStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (!bookmarks) return { success: true, data: DEFAULTS.BOOKMARKS };
      
      const parsedBookmarks = JSON.parse(bookmarks);
      return { success: true, data: parsedBookmarks };
    } catch (error) {
      console.error('Error parsing bookmarks', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)),
        data: DEFAULTS.BOOKMARKS 
      };
    }
  }

  /**
   * Save bookmarked articles
   */
  saveBookmarks(bookmarks: string[]): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Add a bookmark
   */
  addBookmark(articleId: string): StorageResult<void> {
    try {
      const bookmarksResult = this.getBookmarks();
      if (!bookmarksResult.success) {
        // Transform StorageResult<string[]> to StorageResult<void>
        return { 
          success: false, 
          error: bookmarksResult.error 
        };
      }
      
      const bookmarks = bookmarksResult.data || [];
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId);
        return this.saveBookmarks(bookmarks);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Remove a bookmark
   */
  removeBookmark(articleId: string): StorageResult<void> {
    try {
      const bookmarksResult = this.getBookmarks();
      if (!bookmarksResult.success) {
        return { 
          success: false, 
          error: bookmarksResult.error 
        };
      }
      
      const bookmarks = bookmarksResult.data || [];
      const updatedBookmarks = bookmarks.filter(id => id !== articleId);
      return this.saveBookmarks(updatedBookmarks);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save articles to local storage
   */
  saveArticles(articles: Article[]): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get articles from local storage
   */
  getArticles(): StorageResult<Article[]> {
    try {
      const articles = safeStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (!articles) return { success: true, data: [] };
      
      const parsedArticles = JSON.parse(articles);
      return { success: true, data: parsedArticles };
    } catch (error) {
      console.error('Error parsing articles', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)),
        data: [] 
      };
    }
  }

  /**
   * Check if an article is bookmarked
   */
  isBookmarked(articleId: string): StorageResult<boolean> {
    try {
      const bookmarksResult = this.getBookmarks();
      if (!bookmarksResult.success) return { ...bookmarksResult, data: false };
      
      const bookmarks = bookmarksResult.data || [];
      return { success: true, data: bookmarks.includes(articleId) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)), data: false };
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken(): StorageResult<string | null> {
    try {
      const token = safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return { success: true, data: token };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save authentication token
   */
  saveAuthToken(token: string): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Remove authentication token (logout)
   */
  removeAuthToken(): StorageResult<void> {
    try {
      const success = safeStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Record last visited timestamp
   */
  recordVisit(): StorageResult<Date> {
    try {
      const now = new Date();
      const success = safeStorage.setItem(STORAGE_KEYS.LAST_VISITED, now.toISOString());
      return { success, data: now };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get last visited timestamp
   */
  getLastVisit(): StorageResult<Date | null> {
    try {
      const timestamp = safeStorage.getItem(STORAGE_KEYS.LAST_VISITED);
      if (!timestamp) return { success: true, data: null };
      
      const date = new Date(timestamp);
      return { success: true, data: date };
    } catch (error) {
      console.error('Error parsing last visited timestamp', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)), data: null };
    }
  }

  /**
   * Save user data to local storage
   */
  saveUserData(user: User): StorageResult<void> {
    try {
      const success = safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get user data from local storage
   */
  getUserData(): StorageResult<User | null> {
    try {
      const userData = safeStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return { success: true, data: null };
      
      const user = JSON.parse(userData);
      return { success: true, data: user };
    } catch (error) {
      console.error('Error parsing user data', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)), data: null };
    }
  }

  /**
   * Clear user data (for logout)
   */
  clearUserData(): StorageResult<void> {
    try {
      const success = safeStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Save all user preferences in a single operation
   */
  saveAllPreferences(preferences: UserPreferences): StorageResult<void> {
    try {
      // Batch all operations, stopping on first failure
      const operations = [
        this.saveThemePreference(preferences.theme),
        this.saveDefaultBiasMode(preferences.defaultBiasMode),
        this.saveFontSize(preferences.fontSize),
        this.saveCardSize(preferences.cardSize),
        this.saveArticlesPerPage(preferences.articlesPerPage),
        this.savePreferredCategories(preferences.preferredCategories),
        this.saveBookmarks(preferences.bookmarks)
      ];
      
      const failed = operations.find(op => !op.success);
      if (failed) return failed;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get all user preferences in a single operation
   */
  getAllPreferences(): StorageResult<UserPreferences> {
    try {
      const themeResult = this.getThemePreference();
      const biasModeResult = this.getDefaultBiasMode();
      const fontSizeResult = this.getFontSize();
      const cardSizeResult = this.getCardSize();
      const articlesPerPageResult = this.getArticlesPerPage();
      const preferredCategoriesResult = this.getPreferredCategories();
      const bookmarksResult = this.getBookmarks();
      
      // Check if any operation failed
      const results = [
        themeResult, biasModeResult, fontSizeResult, cardSizeResult,
        articlesPerPageResult, preferredCategoriesResult, bookmarksResult
      ];
      
      const failed = results.find(result => !result.success);
      if (failed) return { 
        success: false, 
        error: failed.error || new Error('Failed to get preferences') 
      };
      
      const preferences: UserPreferences = {
        theme: themeResult.data || DEFAULTS.THEME,
        defaultBiasMode: biasModeResult.data ?? DEFAULTS.DEFAULT_BIAS_MODE,
        fontSize: fontSizeResult.data || DEFAULTS.FONT_SIZE,
        cardSize: cardSizeResult.data ?? DEFAULTS.CARD_SIZE,
        articlesPerPage: articlesPerPageResult.data ?? DEFAULTS.ARTICLES_PER_PAGE,
        preferredCategories: preferredCategoriesResult.data || DEFAULTS.PREFERRED_CATEGORIES,
        bookmarks: bookmarksResult.data || DEFAULTS.BOOKMARKS
      };
      
      return { success: true, data: preferences };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Track article reading history
   */
  trackReadArticle(articleId: number): StorageResult<void> {
    try {
      const historyResult = this.getReadingHistory();
      // If history retrieval failed, transform the StorageResult<number[]> to StorageResult<void>
      if (!historyResult.success) {
        return { 
          success: false, 
          error: historyResult.error 
          // No data property for StorageResult<void>
        };
      }
      
      const articleHistory = historyResult.data || [];
      
      // Add to history if not already there
      if (!articleHistory.includes(articleId)) {
        // Keep history limited to 100 most recent articles
        const updatedHistory = [articleId, ...articleHistory].slice(0, 100);
        const success = safeStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(updatedHistory));
        return { success };
      }
      
      // No changes needed
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get reading history
   */
  getReadingHistory(): StorageResult<number[]> {
    try {
      const history = safeStorage.getItem(STORAGE_KEYS.READING_HISTORY);
      if (!history) return { success: true, data: [] };
      
      const parsedHistory = JSON.parse(history);
      return { success: true, data: parsedHistory };
    } catch (error) {
      console.error('Error parsing reading history', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)),
        data: [] 
      };
    }
  }

  /**
   * Clear all storage data (for complete reset)
   */
  clearAll(): StorageResult<void> {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        safeStorage.removeItem(key);
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Record the last sync timestamp 
   */
  recordSyncTimestamp(): StorageResult<Date> {
    try {
      const now = new Date();
      const success = safeStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, now.toISOString());
      return { success, data: now };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Get the last sync timestamp
   */
  getLastSyncTimestamp(): StorageResult<Date | null> {
    try {
      const timestamp = safeStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP);
      if (!timestamp) return { success: true, data: null };
      
      const date = new Date(timestamp);
      return { success: true, data: date };
    } catch (error) {
      console.error('Error parsing sync timestamp', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)), data: null };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();