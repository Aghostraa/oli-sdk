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
export { RestClient } from './rest';
export { createProxyHandler } from './proxy';
export type { ProxyHandlerOptions } from './proxy';

// Types - Common
export type {
  OLIConfig,
  LabelDisplayConfig,
  LabelFilterConfig,
  APIConfig,
  ResolvedAPIConfig
} from './types/common';
export { DEFAULT_API_CONFIG } from './types/common';

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

// Types - REST API
export type {
  LabelsQueryParams,
  LabelsResponse,
  BulkLabelsRequest,
  BulkLabelsResponse,
  LabelSearchResponse,
  AddressWithLabel,
  AttestationPayload,
  AttestationSig,
  AttestationTypes,
  AttestationTypesField,
  AttestationDomain,
  AttestationMessage,
  AttestationSignatureFields,
  SingleAttestationResponse,
  BulkAttestationRequest,
  BulkAttestationResponse,
  RestAttestationQueryParams,
  RestAttestationQueryResponse,
  RestAttestationRecord,
  AttesterAnalyticsQueryParams,
  AttesterAnalyticsResponse,
  AttesterAnalytics,
  TagBreakdownQueryParams,
  TagBreakdownResponse,
  TagBreakdownItem,
  HTTPValidationError,
  ValidationError,
  LabelItem,
  AddressLabels
} from './types/api';
export { RestAPIError } from './rest';

// Types - Attestations
export type {
  RawAttestation,
  DecodedDataItem,
  ExpandedAttestation,
  CommonOLITags
} from './types/attestation';

// Helper utilities
export * as helpers from './helpers';
export type { LabelSummary } from './helpers';

// Default export
export { OLIClient as default } from './client';
