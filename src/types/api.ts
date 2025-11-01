/**
 * Types generated from the Open Labels Initiative REST API schema
 * Source: https://api.openlabelsinitiative.org/openapi.json
 */

export interface LabelItem {
  tag_id: string;
  tag_value: string;
  chain_id: string;
  time: string;
  attester: string | null;
}

export interface LabelsResponse {
  address: string;
  count: number;
  labels: LabelItem[];
}

export interface LabelsQueryParams extends Record<string, string | number | boolean | null | undefined> {
  address: string;
  chain_id?: string | null;
  limit?: number;
  include_all?: boolean;
}

export interface BulkLabelsRequest {
  addresses: string[];
  chain_id?: string | null;
  limit_per_address?: number;
  include_all?: boolean;
}

export interface AddressLabels {
  address: string;
  labels: LabelItem[];
}

export interface BulkLabelsResponse {
  results: AddressLabels[];
}

export interface LabelSearchResponse {
  tag_id: string;
  tag_value: string;
  count: number;
  results: AddressWithLabel[];
}

export interface AddressWithLabel {
  address: string;
  chain_id: string;
  time: string;
  attester: string | null;
}

export interface AttestationPayload {
  sig: AttestationSig;
  signer: string;
}

export interface AttestationSig {
  uid: string;
  types: AttestationTypes;
  domain: AttestationDomain;
  message: AttestationMessage;
  version: number;
  signature: AttestationSignatureFields;
  primaryType: string;
}

export interface AttestationTypes {
  Attest: AttestationTypesField[];
}

export interface AttestationTypesField {
  name: string;
  type: string;
}

export interface AttestationDomain {
  name: string;
  chainId: string;
  version: string;
  verifyingContract: string;
}

export interface AttestationMessage {
  version: number;
  schema: string;
  recipient: string;
  time: string;
  expirationTime: string;
  revocable: boolean;
  refUID: string;
  data: string;
  salt: string;
}

export interface AttestationSignatureFields {
  r: string;
  s: string;
  v: number;
}

export interface SingleAttestationResponse {
  uid: string;
  status?: string;
}

export interface BulkAttestationRequest {
  attestations: AttestationPayload[];
}

export interface BulkAttestationResponse {
  accepted: number;
  duplicates: number;
  failed_validation: Record<string, unknown>[];
  status?: string;
}

export interface RestAttestationRecord {
  uid: string;
  time: string;
  chain_id: string | null;
  attester: string;
  recipient: string | null;
  revoked: boolean;
  is_offchain: boolean;
  ipfs_hash: string | null;
  schema_info: string;
  tags_json: Record<string, unknown> | null;
}

export interface RestAttestationQueryResponse {
  count: number;
  attestations: RestAttestationRecord[];
}

export interface RestAttestationQueryParams extends Record<string, string | number | boolean | null | undefined> {
  uid?: string | null;
  attester?: string | null;
  recipient?: string | null;
  schema_info?: string | null;
  schema_id?: string | null;
  data_contains?: string | null;
  chain_id?: string | null;
  since?: string | null;
  until?: string | null;
  order?: 'asc' | 'desc';
  limit?: number;
  cursor?: string | null;
}

export interface AttesterAnalytics {
  attester: string;
  label_count: number;
  unique_attestations: number;
}

export interface AttesterAnalyticsResponse {
  count: number;
  results: AttesterAnalytics[];
}

export interface AttesterAnalyticsQueryParams extends Record<string, string | number | boolean | null | undefined> {
  chain_id?: string | null;
  limit?: number;
  order_by?: 'tags' | 'attestations';
}

export interface TagBreakdownItem {
  tag_id: string;
  value: string;
  count: number;
}

export interface TagBreakdownResponse {
  tag_id: string;
  total: number;
  results: TagBreakdownItem[];
}

export interface TagBreakdownQueryParams extends Record<string, string | number | boolean | null | undefined> {
  tag_id: string;
  chain_id?: string | null;
  limit?: number;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
