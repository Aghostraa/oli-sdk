/**
 * DataFetcher module for retrieving OLI tags, value sets, and label exports
 */

import yaml from 'js-yaml';
import type { TagDefinitions, TagDefinitionsResponse, UsageCategoriesResponse, ValueSets, TagDefinition } from './types/tags';
import type { IOLIClient } from './types/client';

export class DataFetcher {
  private oli: IOLIClient;

  constructor(oliClient: IOLIClient) {
    this.oli = oliClient;
  }

  /**
   * Get latest OLI tags from OLI GitHub repo.
   * Tags are fetched dynamically so the SDK always has the latest definitions.
   * 
   * @returns Dictionary of official OLI tags keyed by tag_id
   */
  async getOLITags(): Promise<TagDefinitions> {
    const url = 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/refs/heads/main/1_label_schema/tags/tag_definitions.yml';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch OLI tags from GitHub: ${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    const data = yaml.load(text) as TagDefinitionsResponse;
    
    // Convert array to dictionary keyed by tag_id and normalize field names
    const tagDefinitions: TagDefinitions = {};
    for (const tag of data.tags) {
      tagDefinitions[tag.tag_id] = {
        ...tag,
        display_name: tag.name, // Normalize: API uses 'name', we use 'display_name' internally
        name: tag.name // Keep original for compatibility
      };
    }
    
    return tagDefinitions;
  }

  /**
   * Get latest value sets for OLI tags.
   * Value sets are fetched dynamically to always reflect current allowed values.
   * 
   * @returns Dictionary of value sets with tag_id as key
   */
  async getOLIValueSets(): Promise<ValueSets> {
    const valueSets: ValueSets = {};

    // Extract value sets from tag definitions (must be a list)
    for (const tagDefValue of Object.values(this.oli.tagDefinitions)) {
      const tagDef = tagDefValue as TagDefinition;
      if (!tagDef.schema) {
        continue;
      }

      const schema = tagDef.schema;
      const tagId = tagDef.tag_id;
      let valueSet: any[] | null = null;

      // Get enum from direct schema or array items
      if (schema.enum) {
        valueSet = schema.enum;
      } else if (schema.type === 'array' && schema.items && schema.items.enum) {
        valueSet = schema.items.enum;
      }

      // Process and add to valueSets
      if (valueSet && Array.isArray(valueSet)) {
        valueSets[tagId] = valueSet.map(v => 
          typeof v === 'string' ? v.toLowerCase() : v
        );
      }
    }

    // Fetch value set for owner_project from growthepie
    try {
      const projectsUrl = 'https://api.growthepie.com/v1/labels/projects.json';
      const projectsResponse = await fetch(projectsUrl);
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        valueSets['owner_project'] = projectsData.data.data.map((item: any[]) => {
          const val = item[0];
          return typeof val === 'string' ? val.toLowerCase() : val;
        });
      }
    } catch (error) {
      console.warn('Failed to fetch owner_project value set:', error);
    }

    // Fetch value set for usage_category from GitHub
    try {
      const categoryUrl = 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/refs/heads/main/1_label_schema/tags/valuesets/usage_category.yml';
      const categoryResponse = await fetch(categoryUrl);
      
      if (categoryResponse.ok) {
        const categoryText = await categoryResponse.text();
        const categoryData = yaml.load(categoryText) as UsageCategoriesResponse;
        valueSets['usage_category'] = categoryData.categories.map(c => {
          const val = c.category_id;
          return typeof val === 'string' ? val.toLowerCase() : val;
        });
      }
    } catch (error) {
      console.warn('Failed to fetch usage_category value set:', error);
    }

    return valueSets;
  }

  /**
   * Downloads the full raw export of all labels in the OLI Label Pool.
   * Returns the data as JSON (browser-friendly).
   * 
   * @returns Array of raw label data
   */
  async getFullRawExport(): Promise<any[]> {
    const url = 'https://api.growthepie.com/v1/oli/labels_raw.json';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download raw labels: ${response.status} - ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Downloads the full decoded export of all labels in the OLI Label Pool.
   * Returns the data as JSON (browser-friendly).
   * 
   * @returns Array of decoded label data
   */
  async getFullDecodedExport(): Promise<any[]> {
    const url = 'https://api.growthepie.com/v1/oli/labels_decoded.json';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download decoded labels: ${response.status} - ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get all valid values for a specific tag.
   * Useful for validation and auto-complete features.
   * 
   * @param tagId - The tag_id to get valid values for
   * @returns Array of valid values, or undefined if tag has no value set
   */
  getValidValuesForTag(tagId: string): any[] | undefined {
    return this.oli.valueSets[tagId];
  }

  /**
   * Check if a value is valid for a specific tag.
   * 
   * @param tagId - The tag_id to check against
   * @param value - The value to validate
   * @returns True if valid, false if invalid or tag has no value set
   */
  isValidValue(tagId: string, value: any): boolean {
    const validValues = this.oli.valueSets[tagId];
    if (!validValues) {
      return true; // No value set means any value is valid
    }
    
    // Normalize for comparison
    const normalizedValue = typeof value === 'string' ? value.toLowerCase() : value;
    return validValues.some((v: any) => v === normalizedValue);
  }
}

