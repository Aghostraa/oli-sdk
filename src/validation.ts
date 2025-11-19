import { z } from 'zod';
import type {
  LabelsResponse,
  BulkLabelsResponse,
  LabelSearchResponse,
  RestAttestationQueryResponse,
  RestAttestationRecord,
  AttesterAnalyticsResponse,
  AttesterAnalytics,
  AddressLabels,
  LabelItem,
  TagBreakdownResponse
} from './types/api';

const labelItemSchema = z.object({
  tag_id: z.string(),
  tag_value: z.string(),
  chain_id: z.string(),
  time: z.string(),
  attester: z.string().nullable()
}) satisfies z.ZodType<LabelItem>;

const labelsResponseSchema = z.object({
  address: z.string(),
  count: z.number(),
  labels: z.array(labelItemSchema)
}) satisfies z.ZodType<LabelsResponse>;

const addressLabelsSchema = z.object({
  address: z.string(),
  labels: z.array(labelItemSchema)
}) satisfies z.ZodType<AddressLabels>;

const bulkLabelsResponseSchema = z.object({
  results: z.array(addressLabelsSchema)
}) satisfies z.ZodType<BulkLabelsResponse>;

const labelSearchResponseSchema = z.object({
  tag_id: z.string(),
  tag_value: z.string(),
  count: z.number(),
  results: z.array(z.object({
    address: z.string(),
    chain_id: z.string(),
    time: z.string(),
    attester: z.string().nullable()
  }))
}) satisfies z.ZodType<LabelSearchResponse>;

const restAttestationRecordSchema = z.object({
  uid: z.string(),
  time: z.string(),
  chain_id: z.string().nullable(),
  attester: z.string(),
  recipient: z.string().nullable(),
  revoked: z.boolean(),
  is_offchain: z.boolean(),
  ipfs_hash: z.string().nullable(),
  schema_info: z.string(),
  tags_json: z.record(z.any()).nullable()
}) satisfies z.ZodType<RestAttestationRecord>;

const restAttestationQueryResponseSchema = z.object({
  count: z.number(),
  attestations: z.array(restAttestationRecordSchema)
}) satisfies z.ZodType<RestAttestationQueryResponse>;

const attesterAnalyticsSchema = z.object({
  attester: z.string(),
  label_count: z.number(),
  unique_attestations: z.number()
}) satisfies z.ZodType<AttesterAnalytics>;

const attesterAnalyticsResponseSchema = z.object({
  count: z.number(),
  results: z.array(attesterAnalyticsSchema)
}) satisfies z.ZodType<AttesterAnalyticsResponse>;

const tagBreakdownItemSchema = z.object({
  tag_id: z.string(),
  value: z.string(),
  count: z.number()
});

const tagBreakdownResponseSchema = z.object({
  tag_id: z.string(),
  total: z.number(),
  results: z.array(tagBreakdownItemSchema)
}) satisfies z.ZodType<TagBreakdownResponse>;

function parseWithSchema<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map(err => `${err.path.join('.') || context}: ${err.message}`).join('; ');
    throw new Error(`Invalid ${context} response: ${message}`);
  }
  return result.data;
}

export const Validation = {
  labels: (data: unknown) => parseWithSchema(labelsResponseSchema, data, 'labels'),
  bulkLabels: (data: unknown) => parseWithSchema(bulkLabelsResponseSchema, data, 'bulk labels'),
  labelSearch: (data: unknown) => parseWithSchema(labelSearchResponseSchema, data, 'label search'),
  attestationQuery: (data: unknown) => parseWithSchema(restAttestationQueryResponseSchema, data, 'attestations'),
  attesterAnalytics: (data: unknown) => parseWithSchema(attesterAnalyticsResponseSchema, data, 'attester analytics'),
  tagBreakdown: (data: unknown) => parseWithSchema(tagBreakdownResponseSchema, data, 'tag breakdown')
};
