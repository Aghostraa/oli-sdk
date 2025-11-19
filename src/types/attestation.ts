/**
 * Attestation-related types for expanded REST responses
 */

/**
 * Raw attestation data from the OLI REST API
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
 * Common OLI tag fields that frequently appear in attestations
 * 
 * **Important Notes:**
 * - These types represent commonly-used tags and provide helpful autocomplete
 * - Tag availability depends on the actual data and may vary by address/attester
 * - New tags may be added to OLI schema at any time (they'll work, just without autocomplete until SDK update)
 * - Deprecated tags may be removed from the schema (they'll be undefined at runtime)
 * - All fields are optional since not every label has every tag
 * 
 * **Dynamic Access:** You can always access any field dynamically:
 * ```typescript
 * const customField = label['my_custom_field'];
 * const futureField = label['newly_added_tag'];
 * ```
 * 
 * This interface serves as **documentation and convenience**, not a strict contract.
 * The SDK remains fully dynamic and will work with any tags, even those not listed here.
 */
export interface CommonOLITags {
  // Identity & Name
  contract_name?: string;
  address_name?: string;
  
  // Type & Nature
  is_eoa?: boolean;
  is_contract?: boolean;
  is_factory_contract?: boolean;
  is_proxy?: boolean;
  
  // Deployment Info
  deployment_tx?: string;
  deployer_address?: string;
  deployment_date?: string;
  deployment_block?: number;
  
  // Categorization
  owner_project?: string;
  usage_category?: string;
  
  // ERC Standards
  erc_type?: string | string[];
  'erc20.symbol'?: string;
  'erc20.name'?: string;
  'erc20.decimals'?: number;
  'erc721.name'?: string;
  'erc721.symbol'?: string;
  
  // Code & Verification
  source_code_verified?: string | boolean;
  code_language?: string;
  code_compiler?: string;
  
  // Chain Context
  chain_id?: string;
  
  // Raw tags JSON (if present)
  tags_json?: string | Record<string, any>;
}

/**
 * Base expanded attestation type
 */
export type BaseExpandedAttestation = Omit<RawAttestation, 'decodedDataJson'> & CommonOLITags & {
  decodedDataJson?: string;
  _parsing_error?: string;
  [key: string]: any;
};

/**
 * Expanded attestation with decoded fields as top-level properties
 * 
 * @template TCustomTags - Custom tag interface for additional type safety
 * 
 * @example
 * ```typescript
 * // Use with common tags only (default)
 * const label: ExpandedAttestation = await oli.rest.getBestLabelForAddress('0x...');
 * // You get autocomplete for contract_name, owner_project, etc.
 * 
 * // Use with custom tags for additional type safety
 * interface MyTags {
 *   custom_field: string;
 *   my_number: number;
 * }
 * 
 * const oli = new OLIClient<MyTags>();
 * const label = await oli.rest.getBestLabelForAddress('0x...');
 * // Now you also get autocomplete for custom_field and my_number
 * ```
 */
export type ExpandedAttestation<TCustomTags extends Record<string, unknown> = Record<string, unknown>> = BaseExpandedAttestation & TCustomTags;
