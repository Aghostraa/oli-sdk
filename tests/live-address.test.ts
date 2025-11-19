import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OLIClient } from '../src';
import { RestClient, RestAPIError } from '../src/rest';
import type { IOLIClient } from '../src/types/client';
import type { ResolvedAPIConfig } from '../src/types/common';

const RUN_LIVE = process.env.RUN_LIVE_TESTS === '1';
const ADDRESS = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function createMockClient(overrides: Partial<ResolvedAPIConfig> = {}): IOLIClient {
  const apiConfig: ResolvedAPIConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
    defaultHeaders: {},
    timeoutMs: 5000,
    retries: 0,
    enableDeduplication: true,
    enableCache: false,
    cacheTtl: 0,
    staleWhileRevalidate: 0,
    ...overrides
  };

  return {
    apiConfig,
    tagDefinitions: {},
    valueSets: {}
  };
}

test('live address smoke test (requires RUN_LIVE_TESTS=1)', { timeout: 30_000 }, async t => {
  if (!RUN_LIVE) {
    t.skip('Set RUN_LIVE_TESTS=1 to exercise the live API');
    return;
  }

  t.diagnostic(`Running live smoke test for ${ADDRESS}`);

  const oli = new OLIClient();
  t.diagnostic('Initializing OLI client');
  await oli.init();

  t.diagnostic('Fetching recent attestations');
  const { attestations } = await oli.api.getAttestationsForAddress(ADDRESS, { limit: 5 });
  t.diagnostic(`Received ${attestations.length} attestations`);
  assert.ok(attestations.length > 0, 'expected at least one attestation');
  assert.equal(attestations[0].recipient?.toLowerCase(), ADDRESS.toLowerCase(), 'recipient should match');

  t.diagnostic('Fetching curated labels');
  const labels = await oli.api.getValidLabelsForAddress(ADDRESS);
  t.diagnostic(`Received ${labels.length} curated labels`);
  assert.ok(labels.length > 0, 'expected at least one curated label');

  t.diagnostic('Fetching address profile summary');
  const profile = await oli.api.getAddressSummary(ADDRESS);
  t.diagnostic(`Profile response: ${profile ? 'found' : 'missing'}`);
  assert.ok(profile, 'profile should be returned');
  assert.equal(profile!.address.toLowerCase(), ADDRESS.toLowerCase(), 'profile should match address');
});

test.describe('RestClient unit coverage', () => {
  test('attaches API key header for protected endpoints', async () => {
    let receivedHeaders: Record<string, string> | undefined;
    globalThis.fetch = async (input, init) => {
      receivedHeaders = init?.headers as Record<string, string>;
      const url = typeof input === 'string' ? input : input.toString();
      assert.equal(url, 'https://api.example.com/labels?address=0xabc');
      return new Response(JSON.stringify({ address: '0xabc', count: 0, labels: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const client = new RestClient(createMockClient());
    await client.getLabels({ address: '0xabc' });

    assert.ok(receivedHeaders, 'headers should be set');
    assert.equal(receivedHeaders!['x-api-key'], 'test-api-key');
    assert.equal(receivedHeaders!['Accept'], 'application/json');
  });

  test('throws when protected endpoint is called without API key', async () => {
    globalThis.fetch = async () => {
      throw new Error('fetch should not be called without API key');
    };

    const client = new RestClient(
      createMockClient({
        apiKey: undefined
      })
    );

    await assert.rejects(
      () => client.getLabels({ address: '0xdef' }),
      (err: unknown) => {
        assert.match(String(err), /API key required/);
        return true;
      }
    );
  });

  test('surfaces HTTP errors with parsed body', async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ detail: [{ msg: 'invalid' }] }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const client = new RestClient(createMockClient());

    await assert.rejects(
      () => client.getAttestations(),
      (err: unknown) => {
        assert.ok(err instanceof RestAPIError);
        const error = err as RestAPIError;
        assert.equal(error.status, 422);
        assert.deepEqual(error.body, { detail: [{ msg: 'invalid' }] });
        return true;
      }
    );
  });

  test('expands attestation records', async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({
        count: 1,
        attestations: [
          {
            uid: '0xuid',
            time: '2024-01-01T00:00:00Z',
            chain_id: 'eip155:8453',
            attester: '0xattester',
            recipient: '0xrecipient',
            revoked: false,
            is_offchain: false,
            ipfs_hash: null,
            schema_info: '8453__0xschema',
            tags_json: {
              contract_name: 'Uniswap Router',
              usage_category: 'dex'
            }
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const client = new RestClient(createMockClient());
    const expanded = await client.getAttestationsExpanded();

    assert.equal(expanded.count, 1);
    assert.equal(expanded.attestations.length, 1);

    const [attestation] = expanded.attestations;
    assert.equal(attestation.id, '0xuid');
    assert.equal(attestation.attester, '0xattester');
    assert.equal(attestation.recipient, '0xrecipient');
    assert.equal(attestation.contract_name, 'Uniswap Router');
    assert.equal(attestation.usage_category, 'dex');
    assert.equal(typeof attestation.tags_json, 'object');
    assert.equal((attestation.tags_json as Record<string, any>)?.contract_name, 'Uniswap Router');
    assert.equal(attestation.timeCreated, 1704067200);
    assert.equal(attestation.time, 1704067200);
    assert.equal(attestation.schema_info, '8453__0xschema');

    const base = await client.getAttestationsForAddress('0xrecipient');
    assert.equal(base.attestations.length, 1);

    const best = await client.getBestLabelForAddress('0xrecipient');
    assert.ok(best);
    assert.equal(best?.contract_name, 'Uniswap Router');

    const name = await client.getDisplayName('0xrecipient');
    assert.equal(name, 'Uniswap Router');

    const summary = await client.getAddressSummary('0xrecipient');
    assert.ok(summary);
    assert.equal(summary?.name, 'Uniswap Router');

    const valid = await client.getValidLabelsForAddress('0xrecipient');
    assert.equal(valid.length, 1);

    const latest = await client.getLatestAttestations({ limit: 1 });
    assert.equal(latest.length, 1);
  });

  test('deduplicates identical in-flight requests', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ count: 0, attestations: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const client = new RestClient(createMockClient());
    await Promise.all([
      client.getAttestations({ attester: '0x1' }),
      client.getAttestations({ attester: '0x1' })
    ]);

    assert.equal(calls, 1);
  });

  test('caches responses when enabled', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response(JSON.stringify({ address: '0xabc', count: 0, labels: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const client = new RestClient(createMockClient({ enableCache: true, cacheTtl: 10_000 }));
    await client.getLabels({ address: '0xabc' });
    await client.getLabels({ address: '0xabc' });

    assert.equal(calls, 1);
  });

  test('searchAttestations filters by tag values', async () => {
    globalThis.fetch = async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/attestations')) {
        return new Response(JSON.stringify({
          count: 2,
          attestations: [
            {
              uid: 'a',
              time: '2024-01-01T00:00:00Z',
              chain_id: 'eip155:1',
              attester: '0xattester',
              recipient: '0x123',
              revoked: false,
              is_offchain: false,
              ipfs_hash: null,
              schema_info: 'schema',
              tags_json: { usage_category: 'dex' }
            },
            {
              uid: 'b',
              time: '2024-01-01T00:00:00Z',
              chain_id: 'eip155:1',
              attester: '0xattester',
              recipient: '0x123',
              revoked: false,
              is_offchain: false,
              ipfs_hash: null,
              schema_info: 'schema',
              tags_json: { usage_category: 'nft' }
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    };

    const client = new RestClient(createMockClient());
    const dex = await client.searchAttestations({ tagKey: 'usage_category', tagValue: 'dex' });
    assert.equal(dex.length, 1);
    assert.equal(dex[0].uid, 'a');

    const any = await client.searchAttestations({ tagValue: 'nft' });
    assert.equal(any.length, 1);
    assert.equal(any[0].uid, 'b');
  });

  test('getAttesterLeaderboard returns analytics results', async () => {
    globalThis.fetch = async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/analytics/attesters')) {
        return new Response(JSON.stringify({
          count: 1,
          results: [
            {
              attester: '0xleader',
              label_count: 10,
              unique_attestations: 8
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    };

    const client = new RestClient(createMockClient());
    const leaderboard = await client.getAttesterLeaderboard({ limit: 5 });
    assert.equal(leaderboard.length, 1);
    assert.equal(leaderboard[0].attester, '0xleader');
  });

  test('getTagBreakdown falls back to client aggregation when endpoint missing', async () => {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/analytics/tags')) {
        return new Response('not found', { status: 404 });
      }
      if (url.includes('/attestations')) {
        return new Response(JSON.stringify({
          count: 2,
          attestations: [
            {
              uid: '1',
              time: '2024-01-01T00:00:00Z',
              chain_id: 'eip155:1',
              attester: '0xattester',
              recipient: '0xabc',
              revoked: false,
              is_offchain: false,
              ipfs_hash: null,
              schema_info: 'schema',
              tags_json: { usage_category: 'dex' }
            },
            {
              uid: '2',
              time: '2024-01-02T00:00:00Z',
              chain_id: 'eip155:1',
              attester: '0xattester',
              recipient: '0xdef',
              revoked: false,
              is_offchain: false,
              ipfs_hash: null,
              schema_info: 'schema',
              tags_json: { usage_category: 'dex' }
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    };

    const client = new RestClient(createMockClient());
    const breakdown = await client.getTagBreakdown({ tag_id: 'usage_category', limit: 10 });
    assert.equal(breakdown.total, 2);
    assert.equal(breakdown.results[0].value, 'dex');
  });

  test('getAttestationsForAddresses returns bulk label data', async () => {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/labels/bulk')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        assert.deepEqual(body.addresses, ['0xabc', '0xdef']);
        return new Response(JSON.stringify({
          results: [
            {
              address: '0xabc',
              labels: [
                {
                  tag_id: 'usage_category',
                  tag_value: 'dex',
                  chain_id: 'eip155:1',
                  time: '2024-01-01T00:00:00Z',
                  attester: '0x1'
                }
              ]
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    };

    const client = new RestClient(createMockClient());
    const results = await client.getAttestationsForAddresses(['0xabc', '0xdef']);
    assert.equal(results.length, 1);
    assert.equal(results[0].address, '0xabc');
    assert.equal(results[0].labels[0].tag_value, 'dex');
  });
});
