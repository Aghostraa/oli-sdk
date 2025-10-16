/**
 * Client-related type definitions
 * Separated to avoid circular dependencies
 */

import type { NetworkConfig } from './common';
import type { TagDefinitions, ValueSets } from './tags';

/**
 * Core OLI client interface
 * Used for dependency injection in sub-modules
 */
export interface IOLIClient {
  readonly network: NetworkConfig;
  readonly graphqlEndpoint: string;
  readonly schemaId: string;
  tagDefinitions: TagDefinitions;
  valueSets: ValueSets;
}

