/**
 * Type definitions for the BiasBrief application
 * Follows a domain-driven design approach to organize types by their domain context
 */

/**
 * Article domain types
 */
export interface Article {
  [x: string]: any;
  /** Unique identifier for the article */
  id: number;
  /** Publication date in ISO format */
  date: string;
  /** Alternative image URL for the article */
  imageUrl?: string;
  /** Source publication name */
  source: string;
  /** Main category the article belongs to */
  section: string;
  /** More specific category classification */
  category?: string;
  /** Biased version of the article title */
  titleBiased?: string;
  /** Unbiased version of the article title */
  titleUnbiased?: string;
  /** Brief excerpt of the article content */
  snippet?: string;
  /** Full article content */
  body?: string;
}

/**
 * Sort order for articles
 */
export type SortOrder = 'new-to-old' | 'old-to-new';

/**
 * Font size options
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Theme options
 */
export type ThemeOption = 'dark' | 'light';

/**
 * User domain types
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** URL to the user's profile picture */
  avatarUrl?: string;
  /** User preferences configuration */
  preferences: UserPreferences;
  /** User's last login date */
  lastLoginAt?: string;
  /** User's account creation date */
  createdAt: string;
}

/**
 * User preferences configuration
 */
export interface UserPreferences {
  /** User's theme preference ('dark' or 'light') */
  theme: ThemeOption;
  /** Whether to show political bias by default */
  defaultBiasMode: boolean;
  /** Font size preference */
  fontSize: FontSize;
  /** Number of articles to display per page */
  articlesPerPage: number;
  /** Size of article cards (grid columns) */
  cardSize: number;
  /** User's preferred article categories */
  preferredCategories: string[];
  /** User's bookmarked article IDs */
  bookmarks: number[];
}

/**
 * API response types
 */
export interface NewsApiResponse {
  /** Status of the API response */
  status: 'ok' | 'error';
  /** Array of articles retrieved */
  articles: Article[];
  /** Total number of results available */
  totalResults: number;
  /** Available article categories */
  categories?: string[];
  /** Error information (if status is 'error') */
  error?: {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
  };
}

/**
 * Analytics event types for tracking user interactions
 */
export interface AnalyticsEvent {
  /** Name of the event */
  name: string;
  /** Timestamp when the event occurred */
  timestamp: string;
  /** Additional properties related to the event */
  properties: Record<string, any>;
}

/**
 * Storage operation result for improved error handling
 */
export interface StorageResult<T = undefined> {
  /** Whether the operation was successful */
  success: boolean;
  /** Data returned by the operation (if applicable) */
  data?: T;
  /** Error object if the operation failed */
  error?: Error;
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** User information (if authenticated) */
  user: User | null;
  /** Loading state during authentication checks */
  loading: boolean;
  /** Authentication token */
  token?: string;
}

/**
 * Form field validation state
 */
export interface FieldValidation {
  /** Whether the field has been validated */
  validated: boolean;
  /** Whether the field value is valid */
  valid: boolean;
  /** Error message when invalid */
  message?: string;
}

/**
 * UI component common props
 */
export interface BaseComponentProps {
  /** CSS class names */
  className?: string;
  /** ID attribute for the component */
  id?: string;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Children elements */
  children?: React.ReactNode;
}

/**
 * Reading history entry
 */
export interface ReadingHistoryItem {
  /** Article ID */
  articleId: number;
  /** When the article was read */
  readAt: string;
  /** How much of the article was read (percentage) */
  readPercentage?: number;
  /** Time spent reading (seconds) */
  timeSpent?: number;
}
