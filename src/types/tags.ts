/**
 * Tag-related types
 * These types are intentionally flexible to support dynamic values from GitHub
 */

/**
 * JSON Schema type definition
 */
export interface JSONSchema {
  type?: string | string[];
  enum?: any[];
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  description?: string;
  [key: string]: any;
}

/**
 * Raw tag definition from API
 */
export interface RawTagDefinition {
  tag_id: string;
  name: string;
  description: string;
  schema: JSONSchema;
  creator?: string;
  examples?: any[];
  notes?: string;
}

/**
 * Tag definition structure used internally (normalized)
 * Uses flexible types to accommodate any tag_id or category values
 */
export interface TagDefinition {
  tag_id: string;
  display_name: string;
  name: string; // Keep original name field
  description: string;
  schema: JSONSchema;
  creator?: string;
  examples?: any[];
  notes?: string;
}

/**
 * Collection of tag definitions keyed by tag_id
 */
export type TagDefinitions = Record<string, TagDefinition>;

/**
 * Value sets for tags with enum constraints
 * Keys are tag_ids, values are arrays of allowed values
 */
export type ValueSets = Record<string, any[]>;

/**
 * Response structure from tag definitions API
 */
export interface TagDefinitionsResponse {
  version?: string;
  tags: RawTagDefinition[];
}

/**
 * Usage category definition (fetched dynamically)
 */
export interface UsageCategory {
  category_id: string;
  display_name: string;
  description: string;
  examples?: string[];
  notes?: string;
}

/**
 * Response structure from usage categories API
 */
export interface UsageCategoriesResponse {
  categories: UsageCategory[];
}

