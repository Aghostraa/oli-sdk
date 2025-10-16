/**
 * Main OLI Client class
 */

import { DataFetcher } from './fetcher';
import { GraphQLClient } from './graphql';
import type { OLIConfig, NetworkConfig, AttesterConfig, LabelDisplayConfig, LabelFilterConfig } from './types/common';
import type { TagDefinitions, ValueSets } from './types/tags';
import type { IOLIClient } from './types/client';
import { NETWORKS as NETWORK_CONFIGS } from './types/common';
import * as helpers from './helpers';

export class OLIClient implements IOLIClient {
  /** Network configuration */
  public readonly network: NetworkConfig;
  
  /** GraphQL endpoint for EAS queries */
  public readonly graphqlEndpoint: string;
  
  /** Schema ID for OLI labels */
  public readonly schemaId: string;
  
  /** Tag definitions (loaded dynamically from GitHub) */
  public tagDefinitions: TagDefinitions = {};
  
  /** Value sets for tags (loaded dynamically) */
  public valueSets: ValueSets = {};
  
  /** Attester configuration */
  public readonly attesterConfig: AttesterConfig;
  
  /** Display configuration */
  public readonly displayConfig: LabelDisplayConfig;
  
  /** Filter configuration */
  public readonly filterConfig: LabelFilterConfig;
  
  /** Auto-rank labels */
  public readonly autoRank: boolean;
  
  /** Helper utilities */
  public readonly helpers = helpers;
  
  /** Data fetcher instance */
  public readonly fetcher: DataFetcher;
  
  /** GraphQL client instance */
  public readonly graphql: GraphQLClient;
  
  /** Initialization state */
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Create a new OLI client instance
   * 
   * @param config - Configuration options
   * 
   * @example
   * ```typescript
   * // Use default network (Base)
   * const oli = new OLIClient();
   * await oli.init();
   * 
   * // Use specific network
   * const oli = new OLIClient({ network: 'OPTIMISM' });
   * await oli.init();
   * 
   * // Custom network
   * const oli = new OLIClient({
   *   network: {
   *     name: 'custom',
   *     graphqlEndpoint: 'https://custom.easscan.org/graphql',
   *     schemaId: '0x...'
   *   }
   * });
   * await oli.init();
   * ```
   */
  constructor(config: OLIConfig = {}) {
    // Resolve network configuration
    if (!config.network) {
      this.network = NETWORK_CONFIGS.BASE;
    } else if (typeof config.network === 'string') {
      this.network = NETWORK_CONFIGS[config.network];
    } else {
      this.network = config.network;
    }

    this.graphqlEndpoint = this.network.graphqlEndpoint;
    this.schemaId = this.network.schemaId;
    
    // Store configurations
    this.attesterConfig = config.attesters || {};
    this.displayConfig = config.display || {
      nameFields: ['contract_name', 'address_name', 'erc20.name', 'name'],
      addressFormat: 'short',
      dateFormat: 'relative',
      showRevoked: false
    };
    this.filterConfig = config.filters || {};
    this.autoRank = config.autoRank ?? true;

    // Initialize sub-modules
    this.fetcher = new DataFetcher(this);
    this.graphql = new GraphQLClient(this);
  }

  /**
   * Initialize the client by loading tag definitions and value sets.
   * This must be called before using the client.
   * 
   * @returns Promise that resolves when initialization is complete
   * 
   * @example
   * ```typescript
   * const oli = new OLIClient();
   * await oli.init();
   * console.log('OLI client ready!');
   * ```
   */
  async init(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this._performInit();
    await this.initPromise;
    this.initPromise = null;
  }

  /**
   * Internal initialization logic
   */
  private async _performInit(): Promise<void> {
    try {
      // Load tag definitions
      this.tagDefinitions = await this.fetcher.getOLITags();
      
      // Load value sets
      this.valueSets = await this.fetcher.getOLIValueSets();
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize OLI client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refresh tag definitions and value sets from GitHub.
   * Use this to get the latest definitions without creating a new client.
   * 
   * @example
   * ```typescript
   * await oli.refresh();
   * console.log('Tag definitions refreshed!');
   * ```
   */
  async refresh(): Promise<void> {
    this.tagDefinitions = await this.fetcher.getOLITags();
    this.valueSets = await this.fetcher.getOLIValueSets();
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure the client is initialized, throw error if not
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('OLI client not initialized. Call await oli.init() first.');
    }
  }

  /**
   * Get a specific tag definition by tag_id
   * 
   * @param tagId - The tag_id to retrieve
   * @returns Tag definition or undefined if not found
   */
  getTag(tagId: string): TagDefinitions[string] | undefined {
    this.ensureInitialized();
    return this.tagDefinitions[tagId];
  }

  /**
   * Get all available tag IDs
   * 
   * @returns Array of tag IDs
   */
  getTagIds(): string[] {
    this.ensureInitialized();
    return Object.keys(this.tagDefinitions);
  }

  /**
   * Get valid values for a specific tag
   * 
   * @param tagId - The tag_id to get values for
   * @returns Array of valid values or undefined if tag has no value set
   */
  getValidValues(tagId: string): any[] | undefined {
    this.ensureInitialized();
    return this.valueSets[tagId];
  }

  /**
   * Validate a value for a specific tag
   * 
   * @param tagId - The tag_id to validate against
   * @param value - The value to validate
   * @returns True if valid or tag has no restrictions
   */
  validateValue(tagId: string, value: any): boolean {
    this.ensureInitialized();
    return this.fetcher.isValidValue(tagId, value);
  }
}

