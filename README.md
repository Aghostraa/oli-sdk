# OLI SDK (Read-Only)

> Type-safe TypeScript/JavaScript client for reading Open Labels Initiative data over REST.

This package focuses on **read** scenarios: fetching labels, analytics, trust lists, and building UI-ready summaries. All write helpers and GraphQL fallbacks have been removed so the surface area is small, predictable, and browser-friendly.

## ✨ Highlights

- **Single REST surface** – every helper tunnels through `/labels`, `/attestations`, `/trust-lists`, and `/analytics`, with optional caching and automatic retries.
- **Dynamic schema loading** – tag definitions & value sets refresh from GitHub so you always validate against the latest standard.
- **Zero write/dependency footprint** – no signer, node provider, or trust setup required; everything runs against the public REST API.
- **UI profiles & enrichment** – `oli.enrich` builds ready-to-render summaries with highlights, formats, and fallback names.
- **Proxy helper** – drop-in middleware injects API keys for browser apps without exposing credentials.

## 📦 Installation

```bash
npm install @openlabels/sdk
# or
yarn add @openlabels/sdk
```

## ⚙️ Configuring the Client

```typescript
import { OLIClient } from '@openlabels/sdk';

const oli = new OLIClient({
  api: {
    apiKey: process.env.OLI_API_KEY!,
    enableCache: true,
    cacheTtl: 30_000
  },
  filters: {
    allowedCategories: ['dex', 'bridge'],
    maxAge: 86_400
  },
  display: {
    addressFormat: 'short',
    dateFormat: 'relative'
  }
});

await oli.init(); // pulls latest tag definitions & value sets
```

### Notable configuration fields

| Path | Description |
|------|-------------|
| `api.apiKey` | Required for protected endpoints (`/labels`, `/addresses/search`, `/analytics`). |
| `filters.allowedCategories / excludedCategories / allowedProjects` | Include/exclude categories or projects globally. |
| `filters.minAge / maxAge` | Filter labels by age (seconds). |
| `display.nameFields / addressFormat / dateFormat` | Customize formatting defaults for helper outputs. |

## 🚀 Quick Start

### 1. Display name for an address

```typescript
const name = await oli.api.getDisplayName('0x1234...');
console.log(name); // "Uniswap Router" (or fallback short address)
```

### 2. UI-ready profile

```typescript
const profile = await oli.enrich.getProfile('0x1234...', {
  highlightTags: ['owner_project', 'usage_category'],
  fallbackName: 'Unknown'
});

console.log(profile.displayName, profile.confidence, profile.highlights);
```

### 3. Bulk labels + search

```typescript
const bulk = await oli.api.getLabelsBulk({
  addresses: ['0x1234...', '0xABCD...'],
  limit_per_address: 10
});

const paymasters = await oli.api.searchAddressesByTag({
  tag_id: 'is_paymaster',
  tag_value: 'true',
  limit: 20
});
```

### 4. Latest attestations

```typescript
const feed = await oli.api.getLatestAttestations({ limit: 25 });
feed.forEach(att => {
  console.log(att.recipient, att.contract_name, att.timeCreated);
});
```

## 📚 Helper Overview

| Helper | Purpose |
|--------|---------|
| `oli.api.getLabels`, `getLabelsBulk` | Raw label payloads (requires API key). |
| `oli.api.getDisplayName`, `getAddressSummary`, `getBestLabelForAddress`, `getValidLabelsForAddress` | Higher-level helpers with filtering, auto-rank, and formatting baked in. |
| `oli.api.getLatestAttestations`, `searchAttestations`, `getAttesterLeaderboard`, `getTrustLists` | Feed, search, analytics, and trust list introspection. |
| `oli.enrich.getProfile`, `getProfiles`, `searchByTag` | Build UI-ready summaries with highlights, fallback names, and optional raw labels. |
| `oli.fetcher.getOLITags`, `getOLIValueSets` | Access raw schema/value-set data (already used internally by `init`). |
| `createProxyHandler` | Express/Next.js middleware that forwards requests to the OLI API while injecting `x-api-key`. |

## 🌐 Proxy Example

```typescript
// /pages/api/oli/[...path].ts (Next.js API route)
import { createProxyHandler } from '@openlabels/sdk/proxy';

export default createProxyHandler({
  apiKey: process.env.OLI_API_KEY!,
  forwardHeaders: ['authorization']
});
```

## 🧪 Development

```bash
npm run build   # bundle to dist/
npm test        # unit tests (uses node:test)
```

> Tests spin up local listeners. If you run them in a restricted environment, you may need to grant permission for IPC sockets.

## 📝 License

MIT © Open Labels Initiative
