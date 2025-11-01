/**
 * Common types used across the SDK
 */

/**
 * Network configuration for different chains
 */
export interface NetworkConfig {
  name: string;
  graphqlEndpoint: string;
  schemaId: string;
}

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
 * Built-in network configurations
 */
export const NETWORKS = {
  BASE: {
    name: 'base',
    graphqlEndpoint: 'https://base.easscan.org/graphql',
    schemaId: '0xb763e62d940bed6f527dd82418e146a904e62a297b8fa765c9b3e1f0bc6fdd68'
  },
  OPTIMISM: {
    name: 'optimism',
    graphqlEndpoint: 'https://optimism.easscan.org/graphql',
    schemaId: '0xb763e62d940bed6f527dd82418e146a904e62a297b8fa765c9b3e1f0bc6fdd68'
  },
  ETHEREUM: {
    name: 'ethereum',
    graphqlEndpoint: 'https://easscan.org/graphql',
    schemaId: '0xb763e62d940bed6f527dd82418e146a904e62a297b8fa765c9b3e1f0bc6fdd68'
  }
} as const;

/**
 * Attester trust configuration
 */
export interface AttesterConfig {
  /** List of trusted attester addresses (whitelist) */
  trustedAttesters?: string[];
  /** List of blocked attester addresses (blacklist) */
  blockedAttesters?: string[];
  /** Prioritize labels by attester (ordered list) */
  attesterPriority?: string[];
}

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
  network?: NetworkConfig | keyof typeof NETWORKS;
  /** Attester trust configuration */
  attesters?: AttesterConfig;
  /** Label display preferences */
  display?: LabelDisplayConfig;
  /** Label filtering defaults */
  filters?: LabelFilterConfig;
  /** Enable automatic label ranking */
  autoRank?: boolean;
  /** Cache duration in seconds (0 = no cache) */
  cacheDuration?: number;
  /** REST API configuration */
  api?: APIConfig;
}
