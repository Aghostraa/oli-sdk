/**
 * Common types used across the SDK
 */

/**
 * Configuration for the REST API
 */
export interface APIConfig {
  /** Base URL for the REST API */
  baseUrl?: string;
  /** API key used for protected endpoints (sent via x-api-key header) */
  apiKey?: string;
  /** Additional headers that should be sent with every request */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Number of automatic retries for transient failures */
  retries?: number;
  /** Enable in-flight request deduplication */
  enableDeduplication?: boolean;
  /** Enable built-in caching */
  enableCache?: boolean;
  /** Duration in milliseconds before cached responses expire */
  cacheTtl?: number;
  /** Additional window during which stale data may be served while refreshing */
  staleWhileRevalidate?: number;
}

/**
 * Resolved REST API configuration with defaults applied
 */
export interface ResolvedAPIConfig {
  baseUrl: string;
  apiKey?: string;
  defaultHeaders: Record<string, string>;
  timeoutMs: number;
  retries: number;
  enableDeduplication: boolean;
  enableCache: boolean;
  cacheTtl: number;
  staleWhileRevalidate: number;
}

/**
 * Default REST API configuration values
 */
export const DEFAULT_API_CONFIG: ResolvedAPIConfig = {
  baseUrl: 'https://api.openlabelsinitiative.org',
  apiKey: undefined,
  defaultHeaders: {},
  timeoutMs: 15_000,
  retries: 0,
  enableDeduplication: true,
  enableCache: false,
  cacheTtl: 0,
  staleWhileRevalidate: 0
};

/**
 * Label display preferences
 */
export interface LabelDisplayConfig {
  /** Preferred field for primary name (in priority order) */
  nameFields?: string[];
  /** Whether to show full addresses or truncated */
  truncateAddresses?: boolean;
  /** Address truncation format */
  addressFormat?: 'short' | 'medium' | 'full';
  /** Date format preference */
  dateFormat?: 'relative' | 'absolute' | 'timestamp';
  /** Whether to show revoked labels */
  showRevoked?: boolean;
}

/**
 * Label filtering configuration
 */
export interface LabelFilterConfig {
  /** Only include specific usage categories */
  allowedCategories?: string[];
  /** Only include labels from specific projects */
  allowedProjects?: string[];
  /** Exclude specific categories */
  excludedCategories?: string[];
  /** Minimum label age in seconds */
  minAge?: number;
  /** Maximum label age in seconds */
  maxAge?: number;
}

/**
 * SDK configuration options
 */
export interface OLIConfig {
  /** Label display preferences */
  display?: LabelDisplayConfig;
  /** Label filtering defaults */
  filters?: LabelFilterConfig;
  /** Cache duration in seconds (0 = no cache) */
  cacheDuration?: number;
  /** REST API configuration */
  api?: APIConfig;
}
