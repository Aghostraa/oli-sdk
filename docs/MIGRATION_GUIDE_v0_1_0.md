
# Migration Guide: 0.1.0 REST Upgrade

The 0.1.x series introduces a REST-first experience with new helpers, caching, and proxy tooling. Follow the steps below to migrate smoothly from previous releases.

## 1. Upgrade Dependencies

```bash
npm install @openlabels/sdk@^0.1.0
# or
yarn add @openlabels/sdk@^0.1.0
```

> **Note:** The SDK now depends on `zod` for runtime validation. It is bundled automatically when you install the package.

## 2. Set Your API Key

```bash
export OLI_API_KEY=\"YOUR_PROJECT_KEY\"
```

Avoid inlining secrets in browser bundles. Use environment variables or secret managers.

## 3. (Optional) Add the Proxy Middleware

For browser apps, forward requests through your backend:

```ts
// Express example
import express from 'express';
import { createProxyHandler } from '@openlabels/sdk/proxy';

const app = express();
app.use('/api/oli', createProxyHandler({
  apiKey: process.env.OLI_API_KEY!,
  forwardHeaders: ['authorization']
}));
```

For Next.js (pages router):

```ts
// pages/api/oli/[...path].ts
import { createProxyHandler } from '@openlabels/sdk/proxy';

export default createProxyHandler({
  apiKey: process.env.OLI_API_KEY!,
  pathRewrite: path => path.replace(/^\\/api\\/oli/, '')
});
```

## 4. Update Client Initialization

```ts
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

## 5. Replace GraphQL Helpers (Legacy)

GraphQL helpers still exist but are marked `@deprecated`. Prefer the new REST methods:

| Old GraphQL Helper | New REST Helper |
| ------------------ | --------------- |
| `graphql.getLabelsForAddress` | `rest.getAttestationsForAddress` / `rest.getValidLabelsForAddress` |
| `graphql.getDisplayName` | `rest.getDisplayName` |
| `graphql.getAddressSummary` | `rest.getAddressSummary` |
| `graphql.getBestLabelForAddress` | `rest.getBestLabelForAddress` |
| `graphql.queryAttestations` | `rest.getLatestAttestations` / `rest.searchAttestations` |

## 6. Leverage New Analytics & Bulk Helpers

- `rest.getAttesterLeaderboard({ limit, orderBy })`
- `rest.getTagBreakdown({ tag_id, chain_id?, limit? })`
- `rest.getAttestationsForAddresses(addresses, options)`
- `rest.searchAttestations({ address?, attester?, tagKey?, tagValue? })`

All responses are validated and already include flattened tag fields.

## 7. Handle Runtime Validation Errors

Responses are validated with Zod. If the API changes unexpectedly, the SDK throws an error such as:

```
Invalid attester analytics response: results.0.label_count: Expected number, received string
```

Log these errors and update your integration or reach out to the OLI team.

## 8. Testing

- Use the new mocked integration tests in `tests/rest-client.test.ts` as examples.
- When possible, configure `OLI_SANDBOX_API_KEY` in CI to run live smoke tests (coming soon).

## 9. Cleanup

- Remove manual `fetch` calls to the OLI REST API; the SDK now covers all read workloads.
- Keep GraphQL helpers only if you rely on EAS-specific queries.

You're done! The SDK now manages REST calls, caching, analytics, and proxying so your app can focus on delivering UX.

