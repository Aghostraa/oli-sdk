/**
 * GraphQL client module for querying attestations from EAS
 */

import type {
  AttestationFilters,
  AttestationQueryResponse,
  ExpandedAttestationQueryResponse,
  ExpandedAttestation,
  GraphQLVariables,
  DecodedDataItem
} from './types/attestation';
import type { IOLIClient } from './types/client';
import * as helpers from './helpers';

export class GraphQLClient {
  private oli: IOLIClient;

  constructor(oliClient: IOLIClient) {
    this.oli = oliClient;
  }

  /**
   * Queries attestations from the EAS GraphQL API based on the specified filters.
   * 
   * @param filters - Query filters (address, attester, timeCreated, etc.)
   * @returns JSON response containing matching attestation data
   */
  async queryAttestations(filters: AttestationFilters = {}): Promise<AttestationQueryResponse | ExpandedAttestationQueryResponse> {
    const {
      address,
      attester,
      timeCreated,
      revocationTime,
      take,
      id,
      expandJson = true
    } = filters;

    const query = `
      query Attestations($take: Int, $where: AttestationWhereInput, $orderBy: [AttestationOrderByWithRelationInput!]) {
        attestations(take: $take, where: $where, orderBy: $orderBy) {
          attester
          decodedDataJson
          expirationTime
          id
          ipfsHash
          isOffchain
          recipient
          refUID
          revocable
          revocationTime
          revoked
          time
          timeCreated
          txid
        }
      }
    `;

    const variables: GraphQLVariables = {
      where: {
        schemaId: {
          equals: this.oli.schemaId
        }
      },
      orderBy: [
        {
          timeCreated: 'desc'
        }
      ]
    };

    // Add filters to variables
    if (take !== undefined) {
      variables.take = Math.floor(take);
    }

    if (id) {
      variables.where.id = { equals: id };
    }

    if (address) {
      variables.where.recipient = { equals: address };
    }

    if (attester) {
      variables.where.attester = { equals: attester };
    }

    if (timeCreated !== undefined) {
      variables.where.timeCreated = { gt: Math.floor(timeCreated) };
    }

    if (revocationTime !== undefined) {
      variables.where.revocationTime = { gte: Math.floor(revocationTime) };
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    const response = await fetch(this.oli.graphqlEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphQL query failed with status code ${response.status}: ${errorText}`);
    }

    const data = await response.json() as AttestationQueryResponse;

    if (expandJson) {
      return this.expandDecodedDataJson(data);
    } else {
      return data;
    }
  }

  /**
   * Expand decodedDataJson fields in attestations data into separate columns.
   * This makes the data easier to work with by flattening the nested structure.
   * 
   * @param attestationsData - GraphQL response from queryAttestations()
   * @returns Response with expanded decodedDataJson fields
   */
  expandDecodedDataJson(attestationsData: AttestationQueryResponse): ExpandedAttestationQueryResponse {
    const expandedData: ExpandedAttestation[] = [];

    for (const row of attestationsData.data.attestations) {
      // Start with the original row data
      const expandedRow: ExpandedAttestation = { ...row };

      // Check if decodedDataJson exists and is not empty
      if (row.decodedDataJson) {
        try {
          // Parse the JSON string
          let decodedData: DecodedDataItem[];
          if (typeof row.decodedDataJson === 'string') {
            decodedData = JSON.parse(row.decodedDataJson);
          } else {
            decodedData = row.decodedDataJson as any;
          }

          // Extract each field from the decoded data
          for (const item of decodedData) {
            const fieldName = item.name;

            // Extract the actual value from the nested structure
            if (item.value && 'value' in item.value) {
              const value = item.value.value;

              // Handle BigNumber hex values
              if (value && typeof value === 'object' && value.type === 'BigNumber' && value.hex) {
                expandedRow[fieldName] = parseInt(value.hex, 16);
              }
              // Handle empty arrays or objects
              else if ((Array.isArray(value) || typeof value === 'object') && 
                       ((Array.isArray(value) && value.length === 0) || 
                        (typeof value === 'object' && value !== null && Object.keys(value).length === 0))) {
                expandedRow[fieldName] = value;
              }
              else {
                expandedRow[fieldName] = value;
              }

              // Special handling for OLI tags_json field - parse and expand it
              if (fieldName === 'tags_json' && typeof value === 'string' && value) {
                try {
                  const tags = JSON.parse(value);
                  // Merge parsed tags into the expanded row
                  Object.assign(expandedRow, tags);
                } catch (e) {
                  // If parsing fails, just keep the raw string
                  console.warn('Failed to parse tags_json:', e);
                }
              }
            } else {
              expandedRow[fieldName] = null;
            }
          }
        } catch (error) {
          // If parsing fails, keep original row and add error info
          expandedRow._parsing_error = error instanceof Error ? error.message : String(error);
        }
      }

      expandedData.push(expandedRow);
    }

    return {
      data: {
        attestations: expandedData
      }
    };
  }

  /**
   * Get labels for a specific address.
   * Convenience method that filters by recipient address.
   * 
   * @param address - Ethereum address to get labels for
   * @param options - Additional query options
   * @returns Expanded attestations for the address
   */
  async getLabelsForAddress(
    address: string,
    options: Omit<AttestationFilters, 'address'> = {}
  ): Promise<ExpandedAttestationQueryResponse> {
    return this.queryAttestations({
      ...options,
      address,
      expandJson: true
    }) as Promise<ExpandedAttestationQueryResponse>;
  }

  /**
   * Get labels created by a specific attester.
   * Convenience method that filters by attester address.
   * 
   * @param attester - Ethereum address of the attester
   * @param options - Additional query options
   * @returns Expanded attestations by the attester
   */
  async getLabelsByAttester(
    attester: string,
    options: Omit<AttestationFilters, 'attester'> = {}
  ): Promise<ExpandedAttestationQueryResponse> {
    return this.queryAttestations({
      ...options,
      attester,
      expandJson: true
    }) as Promise<ExpandedAttestationQueryResponse>;
  }

  /**
   * Get the best label for an address using configured filters and ranking.
   * This is a high-level convenience method that applies all SDK configurations.
   * 
   * @param address - Ethereum address to get label for
   * @param options - Additional query options
   * @returns The best matching label or null
   * 
   * @example
   * ```typescript
   * const label = await oli.graphql.getBestLabelForAddress('0x...');
   * if (label) {
   *   console.log('Name:', oli.helpers.getDisplayName(label));
   * }
   * ```
   */
  async getBestLabelForAddress(
    address: string,
    options: Omit<AttestationFilters, 'address'> = {}
  ): Promise<ExpandedAttestation | null> {
    const result = await this.getLabelsForAddress(address, options);
    const labels = result.data.attestations;
    
    if (labels.length === 0) return null;
    
    return helpers.getBestLabel(
      labels,
      (this.oli as any).attesterConfig,
      (this.oli as any).filterConfig
    );
  }

  /**
   * Get a display-friendly summary for an address.
   * Returns a formatted object ready for UI display.
   * 
   * @param address - Ethereum address to get label for
   * @param options - Additional query options
   * @returns Label summary or null
   * 
   * @example
   * ```typescript
   * const summary = await oli.graphql.getAddressSummary('0x...');
   * if (summary) {
   *   console.log(summary.name); // "Uniswap Router"
   *   console.log(summary.formattedDate); // "2 hours ago"
   * }
   * ```
   */
  async getAddressSummary(
    address: string,
    options: Omit<AttestationFilters, 'address'> = {}
  ): Promise<helpers.LabelSummary | null> {
    const label = await this.getBestLabelForAddress(address, options);
    if (!label) return null;
    
    return helpers.getLabelSummary(label, (this.oli as any).displayConfig);
  }

  /**
   * Get all valid (non-revoked, non-expired) labels for an address.
   * Automatically filters and ranks based on SDK configuration.
   * 
   * @param address - Ethereum address to get labels for
   * @param options - Additional query options
   * @returns Array of valid labels, ranked by priority
   * 
   * @example
   * ```typescript
   * const labels = await oli.graphql.getValidLabelsForAddress('0x...');
   * labels.forEach(label => {
   *   console.log(oli.helpers.getDisplayName(label));
   * });
   * ```
   */
  async getValidLabelsForAddress(
    address: string,
    options: Omit<AttestationFilters, 'address'> = {}
  ): Promise<ExpandedAttestation[]> {
    const result = await this.getLabelsForAddress(address, options);
    let labels = result.data.attestations;
    
    // Filter to only valid labels
    labels = labels.filter(label => helpers.isLabelValid(label));
    
    // Apply attester trust filter
    labels = labels.filter(label => 
      helpers.isAttesterTrusted(label.attester, (this.oli as any).attesterConfig)
    );
    
    // Apply additional filters
    labels = helpers.filterLabels(labels, (this.oli as any).filterConfig);
    
    // Rank if auto-ranking is enabled
    if ((this.oli as any).autoRank) {
      labels = helpers.rankLabels(labels, (this.oli as any).attesterConfig);
    }
    
    return labels;
  }

  /**
   * Get a simple display name for an address.
   * This is the most convenient method for quick lookups.
   * 
   * @param address - Ethereum address to get name for
   * @param fallback - Fallback if no label found (default: formatted address)
   * @returns Display name string
   * 
   * @example
   * ```typescript
   * const name = await oli.graphql.getDisplayName('0x...');
   * console.log(name); // "Uniswap Router" or "0x1234...5678"
   * ```
   */
  async getDisplayName(
    address: string,
    fallback?: string
  ): Promise<string> {
    const label = await this.getBestLabelForAddress(address);
    
    if (!label) {
      return fallback || helpers.formatAddress(
        address, 
        (this.oli as any).displayConfig.addressFormat
      );
    }
    
    return helpers.getDisplayName(label, (this.oli as any).displayConfig);
  }
}

