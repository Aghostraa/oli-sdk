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
}

