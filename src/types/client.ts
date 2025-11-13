/**
 * Client-related type definitions
 * Separated to avoid circular dependencies
 */

import type { ResolvedAPIConfig } from './common';
import type { TagDefinitions, ValueSets } from './tags';

/**
 * Core OLI client interface
 * Used for dependency injection in sub-modules
 */
export interface IOLIClient {
  readonly apiConfig: ResolvedAPIConfig;
  tagDefinitions: TagDefinitions;
  valueSets: ValueSets;
}
