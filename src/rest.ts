/**
 * REST API client for the Open Labels Initiative endpoints
 */

import type { IOLIClient } from './types/client';
import * as helpers from './helpers';
import { Validation } from './validation';
import type { ExpandedAttestation } from './types/attestation';
import type {
  LabelsQueryParams,
  LabelsResponse,
  BulkLabelsRequest,
  BulkLabelsResponse,
  LabelSearchResponse,
  AttestationPayload,
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
  AddressLabels
} from './types/api';

export interface RequestOptions<TResponse = unknown> {
  method?: 'GET' | 'POST';
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  requiresApiKey?: boolean;
  signal?: AbortSignal;
  cacheKey?: string;
  cacheTtl?: number;
  staleWhileRevalidate?: number;
  skipCache?: boolean;
  parser?: (data: unknown) => TResponse;
}

export class RestAPIError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'RestAPIError';
    this.status = status;
    this.body = body;
  }
}

interface CacheEntry<T> {
  timestamp: number;
  data: T;
  revalidatePromise: Promise<T> | null;
}

export class RestClient<TCustomTags extends Record<string, unknown> = Record<string, unknown>> {
  private oli: IOLIClient;
  private pendingRequests = new Map<string, Promise<unknown>>();
  private cacheStore = new Map<string, CacheEntry<unknown>>();

  constructor(oliClient: IOLIClient) {
    this.oli = oliClient;
  }

  /**
   * Return labels for a single address
   */
  async getLabels(params: LabelsQueryParams): Promise<LabelsResponse> {
    return this.request<LabelsResponse>('/labels', {
      method: 'GET',
      query: params,
      requiresApiKey: true,
      parser: Validation.labels,
      cacheKey: `labels:${JSON.stringify(params)}`
    });
  }

  /**
   * Return labels for multiple addresses in bulk
   */
  async getLabelsBulk(payload: BulkLabelsRequest): Promise<BulkLabelsResponse> {
    return this.request<BulkLabelsResponse>('/labels/bulk', {
      method: 'POST',
      body: payload,
      requiresApiKey: true,
      parser: Validation.bulkLabels,
      cacheKey: `labels-bulk:${JSON.stringify(payload)}`
    });
  }

  /**
   * Search addresses by tag
   */
  async searchAddressesByTag(params: {
    tag_id: string;
    tag_value: string;
    chain_id?: string | null;
    limit?: number;
  }): Promise<LabelSearchResponse> {
    return this.request<LabelSearchResponse>('/addresses/search', {
      method: 'GET',
      query: params,
      requiresApiKey: true,
      parser: Validation.labelSearch,
      cacheKey: `address-search:${JSON.stringify(params)}`
    });
  }

  /**
   * Retrieve raw attestation records
   */
  async getAttestations(params: RestAttestationQueryParams = {}): Promise<RestAttestationQueryResponse> {
    const query = this.buildAttestationQuery(params);
    return this.request<RestAttestationQueryResponse>('/attestations', {
      method: 'GET',
      query,
      parser: Validation.attestationQuery,
      cacheKey: `attestations:${JSON.stringify(query)}`
    });
  }

  /**
   * Retrieve attestation records and expand tags_json into top-level fields.
   */
  async getAttestationsExpanded(
    params: RestAttestationQueryParams = {}
  ): Promise<{
    count: number;
    attestations: ExpandedAttestation<TCustomTags>[];
  }> {
    const response = await this.getAttestations(params);
    const attestations = helpers.expandRestAttestations<TCustomTags>(response.attestations);
    return {
      count: response.count,
      attestations
    };
  }

  /**
   * Expand a single REST attestation record.
   */
  expandAttestation(record: RestAttestationRecord): ExpandedAttestation<TCustomTags> {
    return helpers.expandRestAttestation<TCustomTags>(record);
  }

  /**
   * Convenience helper to fetch expanded attestations for a specific recipient address.
   */
  async getAttestationsForAddress(
    address: string,
    options: {
      limit?: number;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    count: number;
    attestations: ExpandedAttestation<TCustomTags>[];
  }> {
    const { limit, order = 'desc' } = options;
    const response = await this.getAttestationsExpanded({
      recipient: address,
      limit,
      order
    });
    return response;
  }

  /**
   * Determine the best label for an address using attester and filter configuration.
   */
  async getBestLabelForAddress(
    address: string,
    options: {
      limit?: number;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ExpandedAttestation<TCustomTags> | null> {
    const { attestations } = await this.getAttestationsForAddress(address, options);
    if (attestations.length === 0) {
      return null;
    }

    const filterConfig = (this.oli as any).filterConfig ?? {};
    return helpers.getBestLabel(attestations, filterConfig);
  }

  /**
   * Generate a display-friendly summary for an address using REST data.
   */
  async getAddressSummary(
    address: string,
    options: {
      limit?: number;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<helpers.LabelSummary | null> {
    const label = await this.getBestLabelForAddress(address, options);
    if (!label) return null;
    const displayConfig = (this.oli as any).displayConfig ?? {};
    return helpers.getLabelSummary(label, displayConfig);
  }

  /**
   * Convenience helper to compute the display name for an address.
   */
  async getDisplayName(
    address: string,
    options: {
      limit?: number;
      order?: 'asc' | 'desc';
      fallback?: string;
    } = {}
  ): Promise<string> {
    const label = await this.getBestLabelForAddress(address, options);
    const displayConfig = (this.oli as any).displayConfig ?? {};
    if (!label) {
      const fallback = options.fallback;
      return fallback ?? helpers.formatAddress(address, displayConfig.addressFormat);
    }
    return helpers.getDisplayName(label, displayConfig);
  }

  /**
   * Retrieve valid (non-revoked) labels for an address with trust and filter checks applied.
   */
  async getValidLabelsForAddress(
    address: string,
    options: {
      limit?: number;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ExpandedAttestation<TCustomTags>[]> {
    const { attestations } = await this.getAttestationsForAddress(address, options);

    const filterConfig = (this.oli as any).filterConfig ?? {};

    let labels = attestations.filter(label => helpers.isLabelValid(label));
    labels = helpers.filterLabels(labels, filterConfig);

    return labels;
  }

  /**
   * Fetch the latest attestations with optional filtering.
   */
  async getLatestAttestations(options: {
    limit?: number;
    attester?: string;
    recipient?: string;
    schemaId?: string;
    dataContains?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<ExpandedAttestation<TCustomTags>[]> {
    const { attester, recipient, schemaId, dataContains, limit, order } = options;
    const { attestations } = await this.getAttestationsExpanded({
      attester: attester ?? null,
      recipient: recipient ?? null,
      schema_id: schemaId ?? null,
      data_contains: dataContains ?? null,
      limit,
      order
    });
    return attestations;
  }

  /**
   * Search attestations using flexible filters.
   */
  async searchAttestations(options: {
    address?: string;
    attester?: string;
    tagKey?: string;
    tagValue?: string;
    schemaId?: string;
    dataContains?: string;
    limit?: number;
    order?: 'asc' | 'desc';
  }): Promise<ExpandedAttestation<TCustomTags>[]> {
    const { tagKey, tagValue, address, attester, schemaId, dataContains, limit, order } = options;
    const { attestations } = await this.getAttestationsExpanded({
      recipient: address ?? null,
      attester: attester ?? null,
      schema_id: schemaId ?? null,
      data_contains: dataContains ?? null,
      limit,
      order
    });

    if (!tagKey) {
      if (!tagValue) {
        return attestations;
      }
      const needle = tagValue.toLowerCase();
      return attestations.filter(att => {
        const record = att as Record<string, unknown>;
        const tags = (att as Record<string, unknown>).tags_json as Record<string, unknown> | null | undefined;
        const directMatch = Object.entries(record)
          .filter(([key]) => !['tags_json', '_parsing_error'].includes(key))
          .some(([, value]) => value !== null && value !== undefined && typeof value !== 'object' && String(value).toLowerCase() === needle);
        if (directMatch) return true;
        if (!tags) return false;
        return Object.values(tags).some(val => String(val).toLowerCase() === needle);
      });
    }

    const needle = tagValue?.toLowerCase();
    return attestations.filter(att => {
      const value = (att as Record<string, unknown>)[tagKey];
      if (value === undefined || value === null) {
        const tags = (att as Record<string, unknown>).tags_json as Record<string, unknown> | null | undefined;
        if (!tags) return false;
        const tagVal = tags[tagKey];
        if (tagVal === undefined || tagVal === null) {
          return false;
        }
        if (!needle) {
          return true;
        }
        if (Array.isArray(tagVal)) {
          return tagVal.some(item => String(item).toLowerCase() === needle);
        }
        return String(tagVal).toLowerCase() === needle;
      }
      if (!needle) return true;
      if (Array.isArray(value)) {
        return value.some(item => String(item).toLowerCase() === needle);
      }
      return String(value).toLowerCase() === needle;
    });
  }

  /**
   * Convenience wrapper around attester analytics.
   */
  async getAttesterLeaderboard(options: {
    limit?: number;
    orderBy?: 'tags' | 'attestations';
  } = {}): Promise<AttesterAnalytics[]> {
    const response = await this.getAttesterAnalytics({
      limit: options.limit,
      order_by: options.orderBy
    });
    return response.results;
  }

  /**
   * Fetch labels for many addresses in a single request.
   */
  async getAttestationsForAddresses(
    addresses: string[],
    options: {
      chain_id?: string | null;
      limit_per_address?: number;
      include_all?: boolean;
    } = {}
  ): Promise<AddressLabels[]> {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('getAttestationsForAddresses requires at least one address');
    }

    const payload: BulkLabelsRequest = {
      addresses,
      chain_id: options.chain_id,
      limit_per_address: options.limit_per_address,
      include_all: options.include_all
    };

    const response = await this.getLabelsBulk(payload);
    return response.results;
  }

  /**
   * Submit a single attestation payload
   */
  async postAttestation(payload: AttestationPayload): Promise<SingleAttestationResponse> {
    return this.request<SingleAttestationResponse>('/attestation', {
      method: 'POST',
      body: payload
    });
  }

  /**
   * Submit multiple attestations in bulk
   */
  async postAttestationsBulk(payload: BulkAttestationRequest): Promise<BulkAttestationResponse> {
    return this.request<BulkAttestationResponse>('/attestations/bulk', {
      method: 'POST',
      body: payload
    });
  }

  /**
   * Retrieve analytics grouped by attester
   */
  async getAttesterAnalytics(params: AttesterAnalyticsQueryParams = {}): Promise<AttesterAnalyticsResponse> {
    return this.request<AttesterAnalyticsResponse>('/analytics/attesters', {
      method: 'GET',
      query: params,
      requiresApiKey: true,
      parser: Validation.attesterAnalytics,
      cacheKey: `attester-analytics:${JSON.stringify(params)}`
    });
  }

  /**
   * Retrieve tag breakdown analytics. Falls back to client-side aggregation if the API does not expose the endpoint yet.
   */
  async getTagBreakdown(params: TagBreakdownQueryParams): Promise<TagBreakdownResponse> {
    try {
      return await this.request<TagBreakdownResponse>('/analytics/tags', {
        method: 'GET',
        query: params,
        requiresApiKey: true,
        parser: Validation.tagBreakdown,
        cacheKey: `tag-breakdown:${JSON.stringify(params)}`
      });
    } catch (error) {
      if (error instanceof RestAPIError && error.status === 404) {
        return this.computeTagBreakdown(params);
      }
      throw error;
    }
  }

  /**
   * Core request handler with retry and timeout support
   */
  private async request<T>(path: string, options: RequestOptions<T>): Promise<T> {
    const { method = 'GET', query, body, headers = {}, requiresApiKey = false, signal, parser } = options;
    const config = this.oli.apiConfig;
    const apiKey = config.apiKey;

    if (requiresApiKey && !apiKey) {
      throw new Error(
        `API key required for ${path}. Provide one via OLIConfig.api.apiKey or per-request headers.`
      );
    }

    const url = this.createUrl(path, query);
    const requestKey = options.cacheKey ?? this.buildRequestKey(method, url.toString(), body);

    const ttl = options.cacheTtl ?? (config.enableCache ? config.cacheTtl : 0);
    const swr = options.staleWhileRevalidate ?? (config.enableCache ? config.staleWhileRevalidate : 0);
    const useCache = !options.skipCache && ttl > 0;
    const useDedup = config.enableDeduplication;

    let staleEntry: CacheEntry<T> | null = null;
    if (useCache) {
      const cached = this.readFromCache<T>(requestKey, ttl, swr);
      if (cached?.state === 'fresh') {
        return cached.value;
      }
      if (cached?.state === 'stale') {
        staleEntry = cached.entry;
      }
    }

    if (useDedup && this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)! as Promise<T>;
    }

    const fetchPromise = this.performFetch<T>({
      method,
      url: url.toString(),
      headers: this.createHeaders({ method, body, headers, requiresApiKey, apiKey }),
      body,
      signal,
      parser: parser ?? ((data) => data as T),
      retries: config.retries,
      timeoutMs: config.timeoutMs
    }).then(result => {
      if (useCache) {
        this.cacheStore.set(requestKey, {
          timestamp: Date.now(),
          data: result,
          revalidatePromise: null
        });
      }
      return result;
    }).finally(() => {
      if (useDedup) {
        this.pendingRequests.delete(requestKey);
      }
    });

    if (staleEntry) {
      staleEntry.revalidatePromise = fetchPromise;
    }

    if (useDedup) {
      this.pendingRequests.set(requestKey, fetchPromise);
    }

    return fetchPromise;
  }

  private createUrl(path: string, query?: Record<string, unknown>): URL {
    const url = new URL(path, this.oli.apiConfig.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }
    return url;
  }

  private createHeaders(options: {
    method: string;
    body?: unknown;
    headers: Record<string, string>;
    requiresApiKey: boolean;
    apiKey?: string;
  }): Record<string, string> {
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...this.oli.apiConfig.defaultHeaders,
      ...options.headers
    };

    if (options.body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    if (options.requiresApiKey && options.apiKey) {
      requestHeaders['x-api-key'] = options.apiKey;
    }

    return requestHeaders;
  }

  private buildRequestKey(method: string, url: string, body?: unknown): string {
    const bodyFragment = body ? `:${JSON.stringify(body)}` : '';
    return `${method.toUpperCase()}:${url}${bodyFragment}`;
  }

  private readFromCache<T>(key: string, ttl: number, swr: number):
    | { state: 'fresh'; entry: CacheEntry<T>; value: T }
    | { state: 'stale'; entry: CacheEntry<T>; value: T }
    | null {
    const entry = this.cacheStore.get(key) as CacheEntry<T> | undefined;
    if (!entry || entry.data === undefined) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age < ttl) {
      return { state: 'fresh', entry, value: entry.data };
    }

    if (age < ttl + swr) {
      return { state: 'stale', entry, value: entry.data };
    }

    if (entry.revalidatePromise) {
      return { state: 'stale', entry, value: entry.data };
    }

    this.cacheStore.delete(key);
    return null;
  }

  private async performFetch<T>(options: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
    parser: (data: unknown) => T;
    retries: number;
    timeoutMs: number;
  }): Promise<T> {
    const { method, url, headers, body, signal, parser, retries, timeoutMs } = options;
    const controller = signal ? null : new AbortController();
    const maxAttempts = Math.max(1, retries + 1);
    let attempt = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    while (attempt < maxAttempts) {
      try {
        if (!signal && timeoutMs > 0) {
          timeoutId = setTimeout(() => controller?.abort(), timeoutMs);
        }

        const response = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: signal ?? controller?.signal
        });

        if (!response.ok) {
          const rawError = await response.text();
          let errorBody: unknown = rawError;
          try {
            if (rawError) {
              errorBody = JSON.parse(rawError);
            }
          } catch {
            // keep raw text
          }

          const shouldRetry = response.status >= 500 && response.status < 600 && attempt < maxAttempts - 1;
          if (shouldRetry) {
            attempt += 1;
            cleanup();
            continue;
          }

          throw new RestAPIError(
            `Request to ${url} failed with status ${response.status}`,
            response.status,
            errorBody
          );
        }

        cleanup();

        if (response.status === 204) {
          return undefined as T;
        }

        const text = await response.text();
        const json = text ? JSON.parse(text) : undefined;
        return parser(json);
      } catch (error) {
        cleanup();
        const isAbortError =
          typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'AbortError';
        if (isAbortError && attempt < maxAttempts - 1) {
          attempt += 1;
          continue;
        }
        if (attempt >= maxAttempts - 1) {
          throw error;
        }
        attempt += 1;
      }
    }

    throw new Error('Unexpected request failure');
  }

  private async computeTagBreakdown(params: TagBreakdownQueryParams): Promise<TagBreakdownResponse> {
    const limit = params.limit ?? 50;
    const { attestations } = await this.getAttestationsExpanded({
      chain_id: typeof params.chain_id === 'string' ? params.chain_id : null,
      limit: Math.max(limit * 3, limit)
    });

    const counts = new Map<string, number>();
    for (const attestation of attestations) {
      const value = (attestation as Record<string, unknown>)[params.tag_id];
      if (value === undefined || value === null) continue;
      const normalized = Array.isArray(value) ? value.join(',') : String(value);
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    const sorted: TagBreakdownItem[] = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ tag_id: params.tag_id, value, count }));

    const total = Array.from(counts.values()).reduce((sum, num) => sum + num, 0);

    return {
      tag_id: params.tag_id,
      total,
      results: sorted
    };
  }

  private buildAttestationQuery(params: RestAttestationQueryParams = {}): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    const assign = (key: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = value;
      }
    };

    // Only include parameters defined in OpenAPI spec for /attestations endpoint
    // See: https://api.openlabelsinitiative.org/openapi.json
    assign('uid', params.uid);
    assign('attester', params.attester);
    assign('recipient', params.recipient);
    assign('schema_info', params.schema_info ?? params.schema_id);
    const since = this.normalizeTimestamp(params.since);
    assign('since', since);
    assign('order', params.order);
    assign('limit', params.limit);

    // Note: The following parameters are not in the OpenAPI spec but are kept for backward compatibility
    // They may be silently ignored by the API if not supported:
    // - data_contains, chain_id, until, cursor, schema_id (as separate param)

    return query;
  }

  private normalizeTimestamp(value: any): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }
}
