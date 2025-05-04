/**
 * Analytics service for BiasBrief
 * 
 * Provides comprehensive tracking of user interactions while
 * following privacy best practices and handling errors
 */

import { track } from '@vercel/analytics';
import { AnalyticsEvent } from './types';

/**
 * Queue for storing events when offline to send later
 */
const eventQueue: AnalyticsEvent[] = [];

/**
 * Configuration options
 */
const config = {
  /**
   * Whether analytics are enabled
   */
  enabled: true,
  
  /**
   * Whether to queue events when offline
   */
  queueOfflineEvents: true,
  
  /**
   * Maximum number of events to queue
   */
  maxQueueSize: 100
};

/**
 * Safely track events with error handling
 */
const safeTrack = (eventName: string, properties?: Record<string, any>): void => {
  if (!config.enabled) return;
  
  try {
    // Add timestamp to properties
    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString()
    };
    
    // Try to send the event
    const trackResult = track(eventName, enrichedProperties);
    
    // Since the Vercel Analytics track function can return void or Promise<void>,
    // we need to carefully check for a Promise in a way TypeScript understands
    if (typeof trackResult !== 'undefined') {
      // Only proceed if trackResult is not void
      const maybePromise = trackResult as unknown;
      
      // Now safely check if it's promise-like
      if (
        maybePromise !== null && 
        typeof maybePromise === 'object' && 
        typeof (maybePromise as any).then === 'function'
      ) {
        // Handle as promise
        (maybePromise as Promise<unknown>).catch((error: any) => {
          console.warn(`Failed to track event: ${eventName}`, error);
          
          // Queue if offline and configured to do so
          if (config.queueOfflineEvents && typeof window !== 'undefined' && !window.navigator.onLine) {
            queueEvent(eventName, enrichedProperties);
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error tracking event: ${eventName}`, error);
  }
};

/**
 * Queue an event to send later
 */
const queueEvent = (name: string, properties: Record<string, any>): void => {
  if (eventQueue.length >= config.maxQueueSize) {
    // Remove oldest event if queue is full
    eventQueue.shift();
  }
  
  eventQueue.push({
    name,
    timestamp: new Date().toISOString(),
    properties
  });
};

/**
 * Process queued events
 */
const processEventQueue = async (): Promise<void> => {
  if (typeof window === 'undefined' || !window.navigator.onLine || !config.enabled || eventQueue.length === 0) return;
  
  // Process events in batches to avoid overwhelming the network
  const batch = eventQueue.splice(0, 10);
  
  for (const event of batch) {
    try {
      await track(event.name, event.properties);
    } catch (error) {
      console.error(`Failed to process queued event: ${event.name}`, error);
      // Put the event back in the queue if it failed
      queueEvent(event.name, event.properties);
      break; // Stop processing if we hit an error
    }
  }
};

/**
 * Process the event queue when coming online
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', processEventQueue);
  
  // Try to process the queue periodically
  setInterval(processEventQueue, 60000);
}

/**
 * Configure analytics
 */
export const configureAnalytics = {
  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    config.enabled = enabled;
  },
  
  /**
   * Enable or disable queueing offline events
   */
  setQueueOfflineEvents(queue: boolean): void {
    config.queueOfflineEvents = queue;
  },
  
  /**
   * Get current configuration
   */
  getConfig(): typeof config {
    return { ...config };
  }
};

/**
 * Analytics event tracking methods
 */
export const trackEvents = {
  /**
   * Track article view
   */
  articleView: (articleId: number, title: string, source?: string, category?: string) => {
    safeTrack('article_view', { 
      articleId, 
      title, 
      source, 
      category
    });
  },
  
  /**
   * Track bias mode toggle
   */
  toggleBiasMode: (isBiased: boolean) => {
    safeTrack('toggle_bias_mode', { isBiased });
  },
  
  /**
   * Track category selection
   */
  categorySelect: (category: string) => {
    safeTrack('category_select', { category });
  },
  
  /**
   * Track bookmark action
   */
  bookmarkArticle: (articleId: number) => {
    safeTrack('bookmark_article', { articleId });
  },
  
  /**
   * Track unbookmark action
   */
  unbookmarkArticle: (articleId: number) => {
    safeTrack('unbookmark_article', { articleId });
  },
  
  /**
   * Track bookmark toggle (for backward compatibility)
   */
  bookmarkToggle: (articleId: number, isBookmarked: boolean) => {
    if (isBookmarked) {
      safeTrack('bookmark_article', { articleId });
    } else {
      safeTrack('unbookmark_article', { articleId });
    }
  },
  
  /**
   * Track search action
   */
  search: (query: string, resultCount?: number) => {
    safeTrack('search', { query, resultCount });
  },
  
  /**
   * Track theme toggle
   */
  toggleTheme: (theme: string) => {
    safeTrack('theme_change', { theme });
  },
  
  /**
   * Track theme change - alias for toggleTheme
   */
  themeChange: (theme: string) => {
    safeTrack('theme_change', { theme });
  },
  
  /**
   * Track sort order change
   */
  sortOrderChange: (order: 'new-to-old' | 'old-to-new') => {
    safeTrack('sort_order_change', { order });
  },
  
  /**
   * Track share action
   */
  share: (method: 'native' | 'clipboard' | 'manual' | 'social', articleId: number, platform?: string) => {
    safeTrack('share', { method, articleId, platform });
  },
  
  /**
   * Track navigation
   */
  navigation: (from: string, to: string) => {
    safeTrack('navigation', { from, to });
  },
  
  /**
   * Track user login
   */
  login: (method: 'email' | 'google' | 'github' | 'anonymous', userId?: string) => {
    safeTrack('login', { method, userId });
  },
  
  /**
   * Track user logout
   */
  logout: () => {
    safeTrack('logout');
  },
  
  /**
   * Track user registration
   */
  register: (method: 'email' | 'google' | 'github') => {
    safeTrack('register', { method });
  },
  
  /**
   * Track error
   */
  error: (error: Error, context?: string) => {
    safeTrack('error', { 
      message: error.message, 
      stack: error.stack, 
      context 
    });
  },
  
  /**
   * Track font size change
   */
  setFontSize: (size: string) => {
    safeTrack('font_size_change', { size });
  },
  
  /**
   * Track layout option change
   */
  setLayoutOption: (option: string, value: string) => {
    safeTrack('layout_change', { option, value });
  },
  
  /**
   * Track default bias mode change
   */
  setDefaultBiasMode: (enabled: boolean) => {
    safeTrack('default_bias_mode_change', { enabled });
  },
  
  /**
   * Track preferred categories update
   */
  setPreferredCategories: (categories: string[]) => {
    safeTrack('preferred_categories_update', { categories });
  },
  
  /**
   * Track batch preferences update
   */
  batchUpdatePreferences: (updatedFields: string[]) => {
    safeTrack('batch_preferences_update', { updatedFields });
  },
  
  /**
   * Track preferences reset
   */
  resetPreferences: () => {
    safeTrack('preferences_reset');
  },
  
  /**
   * Track article click
   */
  articleClick: (articleId: number, position: number, listContext: string) => {
    safeTrack('article_click', { 
      articleId, 
      position, 
      listContext // e.g., "home", "search_results", "category_page"
    });
  },
  
  /**
   * Track feature usage
   */
  featureUse: (featureName: string, details?: Record<string, any>) => {
    safeTrack('feature_use', {
      feature: featureName,
      ...details
    });
  },
  
  /**
   * Track page view (supplement to automatic tracking)
   */
  pageView: (page: string, referrer?: string) => {
    safeTrack('page_view', { page, referrer });
  },
  
  /**
   * Track reading progress
   */
  readingProgress: (articleId: number, percentRead: number, timeSpentSeconds: number) => {
    // Only track at 25%, 50%, 75%, and 100% marks to reduce event volume
    if (percentRead === 25 || percentRead === 50 || percentRead === 75 || percentRead === 100) {
      safeTrack('reading_progress', { 
        articleId, 
        percentRead, 
        timeSpentSeconds 
      });
    }
  },
  
  /**
   * Custom event tracking for flexibility
   */
  custom: (eventName: string, properties: Record<string, any>) => {
    safeTrack(`custom_${eventName}`, properties);
  }
};

/**
 * Analytics debugging tools (only in development)
 */
export const analyticsDebug = process.env.NODE_ENV === 'development' 
  ? {
      /**
       * Get queued events
       */
      getQueuedEvents: (): AnalyticsEvent[] => [...eventQueue],
      
      /**
       * Clear event queue
       */
      clearEventQueue: (): void => {
        eventQueue.length = 0;
      },
      
      /**
       * Log last 10 tracked events (if localStorage is available)
       */
      getRecentEvents: (): AnalyticsEvent[] => {
        try {
          const events = localStorage.getItem('debug_recent_events');
          return events ? JSON.parse(events) : [];
        } catch (e) {
          console.error('Failed to retrieve debug events', e);
          return [];
        }
      }
    }
  : undefined;