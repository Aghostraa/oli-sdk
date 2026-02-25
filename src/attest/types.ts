export type AttestationPrimitive = string | number | boolean;
export type AttestationFieldValue = AttestationPrimitive | AttestationPrimitive[] | null | undefined;

export interface AttestationRowInput {
  [field: string]: AttestationFieldValue;
  chain_id?: string;
  address?: string;
  attestation_network?: number;
}

export interface ProjectRecord {
  owner_project: string;
  display_name?: string;
  main_github?: string;
  website?: string;
  [key: string]: unknown;
}

export type AttestationModeProfileName = 'simpleProfile' | 'advancedProfile';

export interface AttestationModeProfile {
  id: AttestationModeProfileName;
  label: string;
  allowedFields: string[];
  requiresFields: string[];
}

export type AttestationMode = AttestationModeProfileName | AttestationModeProfile;

export interface ValidationOptions {
  mode?: AttestationMode;
  projects?: ProjectRecord[];
  fetchProjects?: () => Promise<ProjectRecord[]>;
  maxRows?: number;
  allowedFields?: string[];
}

export interface PrepareSingleOptions {
  mode?: AttestationMode;
  attestationNetwork?: number;
  recipient?: string;
  validate?: boolean;
  projects?: ProjectRecord[];
  fetchProjects?: () => Promise<ProjectRecord[]>;
}

export interface ParseCsvOptions {
  mode?: AttestationMode;
  projects?: ProjectRecord[];
  fetchProjects?: () => Promise<ProjectRecord[]>;
  allowedFields?: string[];
}

export interface AttestationDiagnostic {
  code: string;
  message: string;
  row?: number;
  field?: string;
  suggestion?: string;
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export interface AttestationDiagnostics {
  errors: AttestationDiagnostic[];
  warnings: AttestationDiagnostic[];
  conversions: AttestationDiagnostic[];
  suggestions: AttestationDiagnostic[];
}

export interface CsvParseResult {
  rows: AttestationRowInput[];
  columns: string[];
  headerMap: Record<string, string | null>;
  diagnostics: AttestationDiagnostics;
}

export interface SingleValidationResult {
  valid: boolean;
  row: AttestationRowInput;
  diagnostics: AttestationDiagnostics;
}

export interface BulkValidationResult {
  valid: boolean;
  rows: AttestationRowInput[];
  validRows: AttestationRowInput[];
  invalidRows: number[];
  diagnostics: AttestationDiagnostics;
}

export interface AttestationNetworkConfig {
  chainId: number;
  name: string;
  easContractAddress: string;
  schemaUID: string;
  schemaDefinition: string;
  explorerUrl: string;
}

export interface PreparedAttestation {
  mode: AttestationModeProfileName;
  network: AttestationNetworkConfig;
  recipient: string;
  chainId: string;
  address: string;
  caip10: string;
  tags: Record<string, unknown>;
  encodedData: string;
  raw: AttestationRowInput;
  request: OnchainAttestationRequestData;
}

export interface OnchainAttestationRequestData {
  recipient: string;
  expirationTime: bigint;
  revocable: boolean;
  refUID: string;
  data: string;
  value: bigint;
}

export interface OnchainAttestationRequest {
  schemaUID: string;
  data: OnchainAttestationRequestData;
  prepared: PreparedAttestation;
}

export interface OnchainSubmitContext {
  network: AttestationNetworkConfig;
  paymasterUrl?: string;
}

export interface OnchainTxResult {
  status: 'success' | 'submitted' | 'failed';
  txHash?: string;
  uids?: string[];
  raw?: unknown;
}

export interface OnchainWalletAdapter {
  name?: string;
  getChainId(): Promise<number>;
  switchNetwork(chainId: number): Promise<void>;
  isSponsorshipSupported?(chainId: number): Promise<boolean>;
  attest(request: OnchainAttestationRequest, context: OnchainSubmitContext): Promise<OnchainTxResult>;
  multiAttest(requests: OnchainAttestationRequest[], context: OnchainSubmitContext): Promise<OnchainTxResult>;
  sponsoredAttest?(request: OnchainAttestationRequest, context: OnchainSubmitContext): Promise<OnchainTxResult>;
  sponsoredMultiAttest?(requests: OnchainAttestationRequest[], context: OnchainSubmitContext): Promise<OnchainTxResult>;
}

export interface OnchainSubmitResult {
  status: 'success' | 'submitted' | 'failed';
  txHash?: string;
  uids: string[];
  sponsored: boolean;
  network: {
    chainId: number;
    name: string;
    explorerUrl: string;
  };
  raw?: unknown;
}

export interface BulkOnchainSubmitResult extends OnchainSubmitResult {
  results: Array<{
    row: number;
    uid?: string;
    status: 'success' | 'failed';
  }>;
}

export class AttestValidationError extends Error {
  public readonly diagnostics: AttestationDiagnostics;

  constructor(message: string, diagnostics: AttestationDiagnostics) {
    super(message);
    this.name = 'AttestValidationError';
    this.diagnostics = diagnostics;
  }
}
