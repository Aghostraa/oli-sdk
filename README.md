# OLI SDK

> TypeScript/JavaScript SDK for querying Open Labels Initiative (OLI) address labels on-chain and off-chain

[![npm version](https://img.shields.io/npm/v/@openlabels/sdk.svg)](https://www.npmjs.com/package/@openlabels/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The OLI SDK provides a simple, type-safe way to query blockchain address labels from the Open Labels Initiative. Perfect for frontends, analytics tools, and any application that needs to retrieve and display address metadata.

## ✨ Features

- 🔄 **Dynamic Types**: Tag definitions and value sets are fetched from GitHub at runtime, so you're always up-to-date
- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🔍 **REST-First Helpers**: High-level `rest.*` helpers for search, analytics, bulk lookups, and latest activity (no manual JSON parsing)
- ⚡ **Caching & Dedup**: Built-in request deduplication plus opt-in cache controls (`cacheTtl`, `staleWhileRevalidate`)
- 🌐 **Multi-Chain**: Supports Base, Optimism, Ethereum, and custom networks
- 🔐 **Proxy Utility**: Ship with a drop-in `createProxyHandler` for Next.js/Express to inject API keys safely
- 🛡️ **Runtime Validation**: Zod-based guards catch breaking API changes with clear error messages

## 📦 Installation

```bash
npm install @openlabels/sdk
```

```bash
yarn add @openlabels/sdk
```

```bash
pnpm add @openlabels/sdk
```

## 🚀 Quick Start

### Step 0: Configure Environment

```bash
export OLI_API_KEY="your_project_api_key"
```

### Step 1: (Optional) Add a Proxy for Browser Apps

```typescript
// /pages/api/oli/[...path].ts (Next.js) or Express middleware
import { createProxyHandler } from '@openlabels/sdk/proxy';

export default createProxyHandler({
  apiKey: process.env.OLI_API_KEY!,
  forwardHeaders: ['authorization']
});
```

### Step 2: Import and Initialize

```typescript
import { OLIClient } from '@openlabels/sdk';

const oli = new OLIClient({
  api: {
    apiKey: process.env.OLI_API_KEY!,
    enableCache: true,
    cacheTtl: 30_000,
    staleWhileRevalidate: 5_000
  }
});

await oli.init();
```

### Step 3: Query Labels

```typescript
// Simple: Get display name
const name = await oli.rest.getDisplayName('0x1234...');

// Complete: Get formatted summary
const summary = await oli.rest.getAddressSummary('0x1234...');
console.log(summary.name, summary.category, summary.formattedDate);

// Analytics: Attester leaderboard
const leaderboard = await oli.rest.getAttesterLeaderboard({ limit: 10 });

// Advanced: Get all valid labels (filtered & ranked)
const labels = await oli.rest.getValidLabelsForAddress('0x1234...');
```

## 🎨 Developer Experience Features

### Convenience Methods

The SDK provides multiple levels of convenience for different use cases:

**Level 1: Simplest** - Just get a name
```typescript
const name = await oli.rest.getDisplayName('0x...');
```

**Level 2: Formatted Summary** - All info ready for UI
```typescript
const summary = await oli.rest.getAddressSummary('0x...');
// Returns: { name, category, formattedDate, formattedAddress, ... }
```

**Level 3: Best Label** - Auto-filtered & ranked
```typescript
const label = await oli.rest.getBestLabelForAddress('0x...');
```

**Level 4: Latest & Search** - Feed-ready data
```typescript
const latest = await oli.rest.getLatestAttestations({ limit: 25 });
const matches = await oli.rest.searchAttestations({ tagKey: 'usage_category', tagValue: 'dex' });
```

**Level 5: All Valid Labels** - Filtered, ranked, sorted
```typescript
const labels = await oli.rest.getValidLabelsForAddress('0x...');
```

**Level 6: Raw Data** - Maximum control
```typescript
const result = await oli.rest.getAttestationsForAddress('0x...');
```

### Smart Configuration

Configure once at initialization, applies everywhere automatically:

```typescript
const oli = new OLIClient({
  attesters: {
    trustedAttesters: ['0x...'],     // Whitelist
    blockedAttesters: ['0x...'],     // Blacklist
    attesterPriority: ['0x...']      // Ranking
  },
  display: {
    nameFields: ['contract_name', 'address_name'],
    addressFormat: 'short',           // Auto-format addresses
    dateFormat: 'relative'            // "2 hours ago"
  },
  filters: {
    allowedCategories: ['dex', 'bridge'],
    excludedCategories: ['spam'],
    minAge: 86400,                   // Filter by age
    maxAge: 31536000
  },
  autoRank: true                     // Auto-sort by trust
});
```

### TypeScript Generics

The SDK supports TypeScript generics for enhanced type safety and autocomplete:

```typescript
// Default - Common tags with autocomplete
const oli = new OLIClient();
const label = await oli.rest.getBestLabelForAddress('0x...');
// Full autocomplete for: contract_name, usage_category, etc.

// Custom tags - Add your own types
interface MyProjectTags {
  my_custom_rating: number;
  my_security_audit: 'passed' | 'failed' | 'pending';
}

const oli = new OLIClient<MyProjectTags>();
const label = await oli.rest.getBestLabelForAddress('0x...');
// Autocomplete for BOTH common tags AND your custom tags!
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [SCHEMA_EVOLUTION_GUIDE.md](./SCHEMA_EVOLUTION_GUIDE.md) for more details.

## 📖 Usage Examples

### Configure REST API Access

Protected endpoints such as `/labels`, `/labels/bulk`, `/addresses/search`, and `/analytics/attesters` require an `x-api-key` header. Provide it via the `api` block when constructing the client:

```typescript
const oli = new OLIClient({
  api: {
    baseUrl: 'https://api.openlabelsinitiative.org',
    apiKey: process.env.OLI_API_KEY!
  }
});
```

You can also set `defaultHeaders`, `timeoutMs`, or `retries` for finer-grained control. Always keep your API key private and rotate it regularly.

### Initialize the Client

```typescript
import { OLIClient, NETWORKS } from '@openlabels/sdk';

// Default (Base network)
const oli = new OLIClient();
await oli.init();

// Specific network
const oli = new OLIClient({ network: 'OPTIMISM' });
await oli.init();

// Custom network
const oli = new OLIClient({
  network: {
    name: 'custom',
    graphqlEndpoint: 'https://custom.easscan.org/graphql',
    schemaId: '0x3969bb076acfb992af54d51274c5c868641ca5344e1aacd0b1f5e4f80ac0822f'
  }
});
await oli.init();
```

### Query Labels for an Address

```typescript
// Get all labels for an address (REST)
const response = await oli.rest.getLabels({ address: '0x1234...' });

console.log('Total labels:', response.count);
for (const label of response.labels) {
  console.log('Tag:', label.tag_id);
  console.log('Value:', label.tag_value);
  console.log('Tagged by:', label.attester);
}

// Bulk lookup
const bulk = await oli.rest.getLabelsBulk({
  addresses: ['0x1234...', '0xabcd...'],
  include_all: true
});
console.log(bulk.results);
```

### Analytics & Tag Insights

```typescript
// Leaderboard
const topAttesters = await oli.rest.getAttesterLeaderboard({ limit: 5, orderBy: 'tags' });

// Full analytics payload (counts + unique attestations)
const analytics = await oli.rest.getAttesterAnalytics({ limit: 20 });

// Tag breakdown (server API or local fallback)
const breakdown = await oli.rest.getTagBreakdown({ tag_id: 'usage_category', limit: 10 });
console.log(breakdown.results);
```

### GraphQL Helpers (EAS) *(Legacy)*

⚠️ **Deprecated**: The GraphQL helper remains available for migrations, but new projects should switch to the REST helpers. TypeScript consumers will see deprecation warnings on `GraphQLClient` methods.

```typescript
// Query with custom filters
const result = await oli.graphql.queryAttestations({
  address: '0x1234...',
  attester: '0xabcd...',
  timeCreated: 1640000000, // Unix timestamp
  take: 50,
  expandJson: true // Expand nested data (default: true)
});

// Get specific attestation by ID
const attestation = await oli.graphql.queryAttestations({
  id: '0x...',
  expandJson: true
});
```

### Working with Tag Definitions

```typescript
// Get all available tags
const tagIds = oli.getTagIds();
console.log('Available tags:', tagIds);

// Get a specific tag definition
const tag = oli.getTag('address_name');
console.log('Tag:', tag.display_name);
console.log('Description:', tag.description);
console.log('Schema:', tag.schema);

// Get valid values for a tag (if it has enum constraints)
const categories = oli.getValidValues('usage_category');
console.log('Valid usage categories:', categories);

// Validate a value
const isValid = oli.validateValue('usage_category', 'dex');
console.log('Is valid:', isValid);
```

### Get Value Sets

```typescript
// Get all value sets
const valueSets = oli.valueSets;
console.log('Usage categories:', valueSets.usage_category);
console.log('Projects:', valueSets.owner_project);

// Use in form validation
function validateLabel(data: any) {
  const validCategories = oli.getValidValues('usage_category');
  if (!validCategories?.includes(data.usage_category)) {
    throw new Error('Invalid usage category');
  }
}
```

### Bulk Address Lookups

```typescript
const bulkLabels = await oli.rest.getAttestationsForAddresses([
  '0x1234...',
  '0xabcd...'
], {
  limit_per_address: 3
});

console.log(bulkLabels[0].address, bulkLabels[0].labels.length);
```

### Bulk Data Export

```typescript
// Get full raw export (all labels)
const rawLabels = await oli.fetcher.getFullRawExport();
console.log('Total labels:', rawLabels.length);

// Get decoded export (expanded data)
const decodedLabels = await oli.fetcher.getFullDecodedExport();
console.log('First label:', decodedLabels[0]);
```

### Refresh Definitions

```typescript
// Refresh tag definitions and value sets without creating new client
await oli.refresh();
console.log('Definitions updated!');
```

### Proxy Middleware

Forward requests through your own backend and automatically inject the `x-api-key` header:

```typescript
import express from 'express';
import { createProxyHandler } from '@openlabels/sdk/proxy';

const app = express();
app.use('/api/oli', createProxyHandler({
  apiKey: process.env.OLI_API_KEY!,
  forwardHeaders: ['authorization']
}));

// Next.js (pages/api/oli/[...path].ts)
export default createProxyHandler({
  apiKey: process.env.OLI_API_KEY!,
  pathRewrite: (path) => path.replace(/^\/api\/oli/, '')
});
```

## 📚 Additional Docs

- [Migration Guide: 0.1.0 REST Upgrade](docs/MIGRATION_GUIDE_v0_1_0.md)

## 🔧 API Reference

### `OLIClient`

Main client class for interacting with OLI.

#### Constructor

```typescript
new OLIClient(config?: OLIConfig)
```

#### Methods

- `init(): Promise<void>` - Initialize the client (required before use)
- `refresh(): Promise<void>` - Refresh tag definitions and value sets
- `getTag(tagId: string): TagDefinition | undefined` - Get tag definition
- `getTagIds(): string[]` - Get all available tag IDs
- `getValidValues(tagId: string): any[] | undefined` - Get valid values for a tag
- `validateValue(tagId: string, value: any): boolean` - Validate a value

#### Properties

- `rest: RestClient` - REST query client (recommended)
- `graphql: GraphQLClient` - GraphQL query client *(legacy)*
- `fetcher: DataFetcher` - Data fetching utilities
- `tagDefinitions: TagDefinitions` - Loaded tag definitions
- `valueSets: ValueSets` - Loaded value sets

### `RestClient`

High-level REST helpers with expanded/tag-parsed output.

#### Methods

- `getDisplayName(address, options?)`
- `getAddressSummary(address, options?)`
- `getBestLabelForAddress(address, options?)`
- `getValidLabelsForAddress(address, options?)`
- `getLatestAttestations(options?)`
- `searchAttestations(options)`
- `getAttesterLeaderboard(options?)`
- `getAttesterAnalytics(options?)`
- `getTagBreakdown(options)`
- `getAttestationsForAddress(address, options?)`
- `getAttestationsForAddresses(addresses, options?)`
- `getLabels`, `getLabelsBulk`, `searchAddressesByTag`
- `postAttestation`, `postAttestationsBulk`

All responses are already expanded (no manual `tags_json` parsing required) and validated at runtime using Zod.

### `GraphQLClient`

⚠️ **Legacy**: GraphQL helpers remain available for backward compatibility but will be removed in a future major release. Prefer the REST helpers above.

#### Methods

- `queryAttestations(filters?: AttestationFilters): Promise<AttestationQueryResponse>` - Query attestations
- `getLabelsForAddress(address: string, options?): Promise<ExpandedAttestationQueryResponse>` - Get labels for address
- `getLabelsByAttester(attester: string, options?): Promise<ExpandedAttestationQueryResponse>` - Get labels by attester

### `DataFetcher`

Utilities for fetching tag definitions and bulk exports.

#### Methods

- `getOLITags(): Promise<TagDefinitions>` - Fetch tag definitions from GitHub
- `getOLIValueSets(): Promise<ValueSets>` - Fetch value sets
- `getFullRawExport(): Promise<any[]>` - Get full raw label export
- `getFullDecodedExport(): Promise<any[]>` - Get full decoded label export
- `getValidValuesForTag(tagId: string): any[] | undefined` - Get valid values
- `isValidValue(tagId: string, value: any): boolean` - Validate value

## 🌐 Supported Networks

- **Base** (default)
- **Optimism**
- **Ethereum Mainnet**
- Custom networks (provide your own configuration)

## ⚠️ Browser vs Node.js: CORS Considerations

**Important:** CORS (Cross-Origin Resource Sharing) is a browser security feature, not a package distribution issue. Publishing to npm doesn't fix CORS - it depends on where your code runs.

### ✅ Node.js (No CORS Issues)
When you use the SDK in Node.js (server-side), CORS is **not an issue** because Node.js doesn't enforce browser CORS policies:

```typescript
// ✅ Works perfectly in Node.js
import { OLIClient } from '@openlabels/sdk';

const oli = new OLIClient({ api: { apiKey: '...' } });
await oli.init();

const labels = await oli.rest.getLabels({ address: '0x1234...' });
```

### ⚠️ Browser (May Have CORS Issues)
When you use the SDK in a browser, you may encounter CORS errors if the API server doesn't have CORS headers enabled:

```typescript
// ⚠️ May fail in browser if API doesn't allow CORS
import { OLIClient } from '@openlabels/sdk';

const oli = new OLIClient({ api: { apiKey: '...' } });
await oli.init();

// This might fail with CORS error in browser
const labels = await oli.rest.getLabels({ address: '0x1234...' });
```

**Solutions for Browser Use:**
1. **Recommended:** Use the SDK from a Node.js backend/API route (serverless functions, Next.js API routes, Express server, etc.)
2. **Proxy:** Use `createProxyHandler` (see above) or your own proxy to forward requests with server-injected credentials
3. **API Server:** Request that the API server adds CORS headers (`Access-Control-Allow-Origin: *`)
4. **Development Only:** Use a browser extension that disables CORS (not for production)

**Bottom Line:** The SDK works identically whether installed from npm or used locally. CORS depends on:
- ✅ **Node.js environment** = No CORS issues
- ⚠️ **Browser environment** = May have CORS issues (depending on API server configuration)

## 🎯 Why Dynamic Types?

Unlike traditional SDKs that hardcode types and enums, the OLI SDK fetches tag definitions and value sets **at runtime** from the OLI GitHub repository. This means:

- ✅ Always up-to-date with the latest tags and values
- ✅ No need to update the SDK when new tags are added
- ✅ Automatic access to new categories, projects, and fields
- ✅ No breaking changes when the schema evolves

Example: When new usage categories are added to OLI, your app automatically recognizes them without any code changes!

## 🔄 Data Flow

```
Your App → OLI SDK → GitHub (tag definitions)
                  ↓
                  → EAS GraphQL API (attestation data)
                  ↓
                  → growthepie API (bulk exports)
```

## 📝 Type Definitions

The SDK is fully typed with TypeScript. Key types include:

- `TagDefinition` - Definition of an OLI tag
- `ExpandedAttestation` - Attestation with decoded fields
- `AttestationFilters` - Query filter options
- `ValueSets` - Valid values for enumerated tags
- `NetworkConfig` - Network configuration

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed SDK architecture and design decisions
- [SCHEMA_EVOLUTION_GUIDE.md](./SCHEMA_EVOLUTION_GUIDE.md) - How the SDK handles schema changes
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guidelines for contributing

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and the main [OLI repository](https://github.com/openlabelsinitiative/OLI) for more information.

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details

## 🔗 Links

- [OLI Documentation](https://github.com/openlabelsinitiative/OLI)
- [GitHub Repository](https://github.com/openlabelsinitiative/OLI)
- [Report Issues](https://github.com/openlabelsinitiative/OLI/issues)

## 💡 Examples

### React Component

```tsx
import { useEffect, useState } from 'react';
import { OLIClient } from '@openlabels/sdk';

function AddressLabel({ address }: { address: string }) {
  const [label, setLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabel = async () => {
      const oli = new OLIClient();
      await oli.init();
      
      const result = await oli.graphql.getLabelsForAddress(address, { take: 1 });
      
      if (result.data.attestations.length > 0) {
        setLabel(result.data.attestations[0].address_name || 'Unknown');
      }
      
      setLoading(false);
    };

    fetchLabel();
  }, [address]);

  if (loading) return <span>Loading...</span>;
  
  return <span>{label || address}</span>;
}
```

### Node.js Script

```javascript
const { OLIClient } = require('@openlabels/sdk');

async function main() {
  const oli = new OLIClient();
  await oli.init();

  console.log('Available tags:', oli.getTagIds());
  
  const labels = await oli.graphql.getLabelsForAddress('0x1234...');
  console.log('Labels:', labels.data.attestations);
}

main();
```

## 🙏 Acknowledgments

Built with ❤️ by the Open Labels Initiative community.
