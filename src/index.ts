/**
 * Open Labels Initiative (OLI) SDK
 * 
 * A TypeScript/JavaScript SDK for querying address labels from the Open Labels Initiative.
 * Provides easy access to on-chain and off-chain label attestations with dynamic type support.
 * 
 * @packageDocumentation
 */

// Main client
export { OLIClient } from './client';

// Sub-modules
export { DataFetcher } from './fetcher';
export { GraphQLClient } from './graphql';

// Types - Common
export type {
  NetworkConfig,
  OLIConfig,
  AttesterConfig,
  LabelDisplayConfig,
  LabelFilterConfig
} from './types/common';
export { NETWORKS } from './types/common';

// Types - Client
export type {
  IOLIClient
} from './types/client';

// Types - Tags
export type {
  JSONSchema,
  RawTagDefinition,
  TagDefinition,
  TagDefinitions,
  ValueSets,
  TagDefinitionsResponse,
  UsageCategory,
  UsageCategoriesResponse
} from './types/tags';

// Types - Attestations
export type {
  RawAttestation,
  DecodedDataItem,
  ExpandedAttestation,
  AttestationFilters,
  GraphQLWhereClause,
  GraphQLOrderBy,
  GraphQLVariables,
  AttestationQueryResponse,
  ExpandedAttestationQueryResponse
} from './types/attestation';

// Helper utilities
export * as helpers from './helpers';
export type { LabelSummary } from './helpers';

// Default export
export { OLIClient as default } from './client';

