/**
 * Helper utilities for working with OLI labels
 * Provides developer-friendly abstractions over raw attestation data
 */

import type { ExpandedAttestation } from './types/attestation';
import type { RestAttestationRecord } from './types/api';

/**
 * Configuration for label display preferences
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
 * Configuration for label filtering
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
 * Get all available tag fields from a label (excluding base attestation fields)
 * Useful for discovering what tags are actually present in a label
 */
export function getAvailableTags<T extends Record<string, unknown> = Record<string, unknown>>(label: ExpandedAttestation<T>): string[] {
  const baseFields = [
    'attester', 'decodedDataJson', 'expirationTime', 'id', 'ipfsHash',
    'isOffchain', 'recipient', 'refUID', 'revocable', 'revocationTime',
    'revoked', 'time', 'timeCreated', 'txid', '_parsing_error'
  ];
  
  return Object.keys(label).filter(key => !baseFields.includes(key));
}

/**
 * Check if a specific tag exists in a label
 */
export function hasTag<T extends Record<string, unknown> = Record<string, unknown>>(label: ExpandedAttestation<T>, tagName: string): boolean {
  return tagName in label && label[tagName] !== undefined && label[tagName] !== null;
}

/**
 * Get a display name from a label with smart fallbacks
 */
export function getDisplayName<T extends Record<string, unknown> = Record<string, unknown>>(
  label: ExpandedAttestation<T>,
  config: LabelDisplayConfig = {}
): string {
  const nameFields = config.nameFields || [
    'contract_name',
    'address_name',
    'erc20.name',
    'erc721.name',
    'name'
  ];

  // Try each field in order
  for (const field of nameFields) {
    const value = label[field];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  // Fallback to formatted address
  return formatAddress(label.recipient, config.addressFormat || 'short');
}

/**
 * Format an Ethereum address
 */
export function formatAddress(
  address: string,
  format: 'short' | 'medium' | 'full' = 'short'
): string {
  if (!address) return 'Unknown';
  
  switch (format) {
    case 'short':
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    case 'medium':
      return `${address.slice(0, 10)}...${address.slice(-8)}`;
    case 'full':
      return address;
    default:
      return address;
  }
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(
  timestamp: number,
  format: 'relative' | 'absolute' | 'timestamp' = 'relative'
): string {
  const date = new Date(timestamp * 1000);
  
  switch (format) {
    case 'relative':
      return getRelativeTime(date);
    case 'absolute':
      return date.toLocaleString();
    case 'timestamp':
      return timestamp.toString();
    default:
      return date.toLocaleString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

/**
 * Filter labels based on configuration
 */
export function filterLabels<T extends Record<string, unknown> = Record<string, unknown>>(
  labels: ExpandedAttestation<T>[],
  config: LabelFilterConfig = {}
): ExpandedAttestation<T>[] {
  return labels.filter(label => {
    // Filter by category
    if (config.allowedCategories) {
      const category = label.usage_category;
      if (!category || !config.allowedCategories.includes(category)) {
        return false;
      }
    }

    if (config.excludedCategories) {
      const category = label.usage_category;
      if (category && config.excludedCategories.includes(category)) {
        return false;
      }
    }

    // Filter by project
    if (config.allowedProjects) {
      const project = label.owner_project;
      if (!project || !config.allowedProjects.includes(project)) {
        return false;
      }
    }

    // Filter by age
    if (config.minAge !== undefined || config.maxAge !== undefined) {
      const now = Math.floor(Date.now() / 1000);
      const age = now - label.timeCreated;

      if (config.minAge !== undefined && age < config.minAge) {
        return false;
      }

      if (config.maxAge !== undefined && age > config.maxAge) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Rank labels by recency and revocation status (non-revoked first)
 */
export function rankLabels<T extends Record<string, unknown> = Record<string, unknown>>(
  labels: ExpandedAttestation<T>[]
): ExpandedAttestation<T>[] {
  return [...labels].sort((a, b) => {
    if (a.revoked !== b.revoked) {
      return a.revoked ? 1 : -1;
    }
    return b.timeCreated - a.timeCreated;
  });
}

/**
 * Get the best label for an address based on configuration
 */
export function getBestLabel<T extends Record<string, unknown> = Record<string, unknown>>(
  labels: ExpandedAttestation<T>[],
  filterConfig: LabelFilterConfig = {}
): ExpandedAttestation<T> | null {
  if (labels.length === 0) return null;

  let filtered = labels.filter(label => isLabelValid(label));
  filtered = filterLabels(filtered, filterConfig);
  if (filtered.length === 0) return null;

  return rankLabels(filtered)[0];
}

/**
 * Check if a label is valid (not revoked, not expired)
 */
export function isLabelValid<T extends Record<string, unknown> = Record<string, unknown>>(label: ExpandedAttestation<T>): boolean {
  // Check if revoked
  if (label.revoked) return false;

  // Check if expired
  if (label.expirationTime > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now > label.expirationTime) return false;
  }

  return true;
}

/**
 * Get all valid field values from a label
 */
export function getLabelFields(label: ExpandedAttestation): Record<string, any> {
  const fields: Record<string, any> = {};

  // Core fields
  const coreFields = [
    'contract_name', 'address_name', 'usage_category', 'owner_project',
    'is_eoa', 'is_contract', 'is_factory_contract', 'is_proxy',
    'deployment_tx', 'deployer_address', 'deployment_date',
    'erc_type', 'erc20.name', 'erc20.symbol', 'chain_id'
  ];

  for (const field of coreFields) {
    if (label[field] !== undefined && label[field] !== null) {
      fields[field] = label[field];
    }
  }

  return fields;
}

/**
 * Get a summary object for display
 */
export interface LabelSummary {
  name: string;
  address: string;
  formattedAddress: string;
  category: string | null;
  project: string | null;
  attester: string;
  formattedAttester: string;
  createdAt: Date;
  formattedDate: string;
  isValid: boolean;
  isRevoked: boolean;
  fields: Record<string, any>;
}

export function getLabelSummary<T extends Record<string, unknown> = Record<string, unknown>>(
  label: ExpandedAttestation<T>,
  displayConfig: LabelDisplayConfig = {}
): LabelSummary {
  return {
    name: getDisplayName(label, displayConfig),
    address: label.recipient,
    formattedAddress: formatAddress(label.recipient, displayConfig.addressFormat),
    category: label.usage_category || null,
    project: label.owner_project || null,
    attester: label.attester,
    formattedAttester: formatAddress(label.attester, displayConfig.addressFormat),
    createdAt: new Date(label.timeCreated * 1000),
    formattedDate: formatTimestamp(label.timeCreated, displayConfig.dateFormat),
    isValid: isLabelValid(label),
    isRevoked: label.revoked,
    fields: getLabelFields(label)
  };
}
function parseRestTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const date = new Date(value);
  const time = Number.isNaN(date.getTime()) ? 0 : Math.floor(date.getTime() / 1000);
  return time;
}

/**
 * Expand a REST attestation record by flattening tags_json and filling required fields.
 */
export function expandRestAttestation<T extends Record<string, unknown> = Record<string, unknown>>(record: RestAttestationRecord): ExpandedAttestation<T> {
  const timeSeconds = parseRestTimestamp(record.time);

  const expanded: Record<string, any> = {
    attester: record.attester,
    expirationTime: 0,
    id: record.uid,
    ipfsHash: record.ipfs_hash ?? '',
    isOffchain: record.is_offchain,
    recipient: record.recipient ?? '',
    refUID: record.uid,
    revocable: true,
    revocationTime: 0,
    revoked: record.revoked,
    time: timeSeconds,
    timeCreated: timeSeconds,
    txid: '',
    chain_id: record.chain_id ?? undefined,
    schema_info: record.schema_info,
    uid: record.uid,
    time_iso: record.time
  };

  if (record.tags_json && typeof record.tags_json === 'object' && !Array.isArray(record.tags_json)) {
    expanded.tags_json = record.tags_json;
    for (const [key, value] of Object.entries(record.tags_json)) {
      expanded[key] = value;
    }
  } else {
    expanded.tags_json = record.tags_json ?? null;
  }

  return expanded as ExpandedAttestation<T>;
}

/**
 * Expand an array of REST attestation records.
 */
export function expandRestAttestations<T extends Record<string, unknown> = Record<string, unknown>>(
  records: RestAttestationRecord[]
): ExpandedAttestation<T>[] {
  return records.map(record => expandRestAttestation<T>(record));
}
