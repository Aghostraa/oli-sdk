/**
 * Attestation-related types for EAS GraphQL queries
 */

/**
 * Raw attestation data from EAS GraphQL API
 */
export interface RawAttestation {
  attester: string;
  decodedDataJson: string;
  expirationTime: number;
  id: string;
  ipfsHash: string;
  isOffchain: boolean;
  recipient: string;
  refUID: string;
  revocable: boolean;
  revocationTime: number;
  revoked: boolean;
  time: number;
  timeCreated: number;
  txid: string;
}

/**
 * Decoded data item structure from attestation
 */
export interface DecodedDataItem {
  name: string;
  value: {
    name: string;
    type: string;
    value: any;
  };
  type: string;
}

/**
 * Expanded attestation with decoded fields as top-level properties
 * Uses flexible types since tag values are dynamic
 */
export interface ExpandedAttestation extends Omit<RawAttestation, 'decodedDataJson'> {
  decodedDataJson?: string;
  // Dynamic fields from decoded data
  [key: string]: any;
  _parsing_error?: string;
}

/**
 * GraphQL query filters for attestations
 */
export interface AttestationFilters {
  /** Ethereum address of the labeled contract */
  address?: string;
  /** Ethereum address of the attester */
  attester?: string;
  /** Filter for attestations created after this timestamp */
  timeCreated?: number;
  /** Filter for attestations with revocation time >= this timestamp */
  revocationTime?: number;
  /** Maximum number of attestations to return */
  take?: number;
  /** Specific attestation ID to filter by */
  id?: string;
  /** Whether to expand decodedDataJson fields into the response */
  expandJson?: boolean;
}

/**
 * GraphQL where clause structure
 */
export interface GraphQLWhereClause {
  schemaId?: {
    equals?: string;
  };
  id?: {
    equals?: string;
  };
  recipient?: {
    equals?: string;
  };
  attester?: {
    equals?: string;
  };
  timeCreated?: {
    gt?: number;
  };
  revocationTime?: {
    gte?: number;
  };
}

/**
 * GraphQL order by structure
 */
export interface GraphQLOrderBy {
  timeCreated?: 'asc' | 'desc';
}

/**
 * GraphQL variables structure
 */
export interface GraphQLVariables {
  where: GraphQLWhereClause;
  orderBy: GraphQLOrderBy[];
  take?: number;
}

/**
 * GraphQL query response structure (raw)
 */
export interface AttestationQueryResponse {
  data: {
    attestations: RawAttestation[];
  };
}

/**
 * GraphQL query response structure (expanded)
 */
export interface ExpandedAttestationQueryResponse {
  data: {
    attestations: ExpandedAttestation[];
  };
}

