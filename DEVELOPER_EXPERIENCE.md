

 # OLI SDK Developer Experience Guide

The OLI SDK is designed with developer experience as the top priority. This guide shows you how to use the SDK's powerful convenience features.

## 🎯 Quick Start (Plug & Play)

### The Simplest Possible Usage

```typescript
import { OLIClient } from '@openlabels/sdk';

const oli = new OLIClient();
await oli.init();

// Just get a name - one line!
const name = await oli.graphql.getDisplayName('0x...');
console.log(name); // "Uniswap Router"
```

That's it! The SDK handles all the complexity automatically.

## ⚙️ Configuration

Configure once, use everywhere. The SDK applies your preferences to all queries automatically.

### Trusted Attesters

Only show labels from attesters you trust:

```typescript
const oli = new OLIClient({
  attesters: {
    // Whitelist: ONLY these attesters
    trustedAttesters: [
      '0xYourTrustedAttester1...',
      '0xYourTrustedAttester2...',
    ],
    
    // Or blacklist: BLOCK these attesters
    blockedAttesters: [
      '0xSpamAttester...',
    ],
    
    // Priority: Rank labels by attester preference
    attesterPriority: [
      '0xMostTrustedAttester...',
      '0xSecondMostTrusted...',
    ]
  }
});
```

### Display Preferences

Configure how labels should be displayed:

```typescript
const oli = new OLIClient({
  display: {
    // What fields to use for the name (in priority order)
    nameFields: ['contract_name', 'address_name', 'erc20.name', 'name'],
    
    // How to format addresses
    addressFormat: 'short', // 'short' | 'medium' | 'full'
    // short:  0x1234...5678
    // medium: 0x12345678...90abcdef
    // full:   0x1234567890abcdef...
    
    // How to format dates
    dateFormat: 'relative', // 'relative' | 'absolute' | 'timestamp'
    // relative: "2 hours ago"
    // absolute: "10/15/2025, 2:50:27 AM"
    // timestamp: "1728985827"
    
    // Show or hide revoked labels
    showRevoked: false
  }
});
```

### Label Filtering

Apply default filters to all queries:

```typescript
const oli = new OLIClient({
  filters: {
    // Only show specific categories
    allowedCategories: ['dex', 'bridge', 'nft_marketplace'],
    
    // Or exclude specific categories
    excludedCategories: ['spam', 'scam'],
    
    // Only show labels from specific projects
    allowedProjects: ['uniswap', 'aave', 'compound'],
    
    // Age filters (in seconds)
    minAge: 86400,      // At least 1 day old (avoid very new labels)
    maxAge: 31536000,   // Not older than 1 year (avoid outdated labels)
  },
  
  // Automatically rank/sort labels by trust and recency
  autoRank: true
});
```

## 📝 Convenience Methods

The SDK provides multiple levels of convenience:

### Level 1: Simple Display Name

```typescript
// Easiest - just get a name!
const name = await oli.graphql.getDisplayName('0x...');
// Returns: "Uniswap Router" or "0x1234...5678" if no label
```

### Level 2: Address Summary

```typescript
// Get all formatted information in one object
const summary = await oli.graphql.getAddressSummary('0x...');

if (summary) {
  console.log(summary.name);               // "Uniswap Router"
  console.log(summary.category);           // "dex"
  console.log(summary.project);            // "uniswap"
  console.log(summary.formattedAddress);   // "0x1234...5678"
  console.log(summary.formattedAttester);  // "0xabcd...ef01"
  console.log(summary.formattedDate);      // "2 hours ago"
  console.log(summary.isValid);            // true
  console.log(summary.fields);             // { contract_name: "...", ... }
}
```

### Level 3: Best Label

```typescript
// Get the best matching label (filtered & ranked automatically)
const label = await oli.graphql.getBestLabelForAddress('0x...');

if (label) {
  // Use helpers for formatted display
  console.log(oli.helpers.getDisplayName(label));
  console.log(oli.helpers.formatTimestamp(label.timeCreated));
}
```

### Level 4: All Valid Labels

```typescript
// Get all valid labels (automatically filtered, ranked, and sorted)
const labels = await oli.graphql.getValidLabelsForAddress('0x...');

labels.forEach(label => {
  console.log(oli.helpers.getDisplayName(label));
  console.log(`Valid: ${oli.helpers.isLabelValid(label)}`);
  console.log(`Trusted: ${oli.helpers.isAttesterTrusted(label.attester)}`);
});
```

### Level 5: Raw Data (Maximum Control)

```typescript
// Get raw attestations for full control
const result = await oli.graphql.getLabelsForAddress('0x...');
const labels = result.data.attestations;

// Apply your own filtering and ranking
```

## 🛠️ Helper Utilities

The SDK includes helper functions for common operations:

### Display Formatting

```typescript
import { helpers } from '@openlabels/sdk';

// Get display name with smart fallbacks
const name = helpers.getDisplayName(label, oli.displayConfig);

// Format addresses in different ways
helpers.formatAddress('0x...', 'short');   // "0x1234...5678"
helpers.formatAddress('0x...', 'medium');  // "0x12345678...cdef"
helpers.formatAddress('0x...', 'full');    // Full address

// Format timestamps
helpers.formatTimestamp(timestamp, 'relative');  // "2 hours ago"
helpers.formatTimestamp(timestamp, 'absolute');  // "10/15/2025, 2:50:27 AM"
helpers.formatTimestamp(timestamp, 'timestamp'); // "1728985827"
```

### Validation

```typescript
// Check if attester is trusted
const trusted = helpers.isAttesterTrusted(
  label.attester,
  oli.attesterConfig
);

// Check if label is valid (not revoked, not expired)
const valid = helpers.isLabelValid(label);
```

### Filtering & Ranking

```typescript
// Filter labels by criteria
const filtered = helpers.filterLabels(labels, {
  allowedCategories: ['dex'],
  maxAge: 31536000
});

// Rank labels by priority
const ranked = helpers.rankLabels(labels, {
  attesterPriority: ['0x...']
});

// Get the single best label
const best = helpers.getBestLabel(
  labels,
  oli.attesterConfig,
  oli.filterConfig
);
```

### Label Summary

```typescript
// Get a complete formatted summary
const summary = helpers.getLabelSummary(label, oli.displayConfig);
// Returns: { name, address, formattedAddress, category, project, ... }
```

## 🎨 UI Integration Patterns

### React Component

```tsx
import { useEffect, useState } from 'react';
import { OLIClient } from '@openlabels/sdk';

function AddressName({ address }: { address: string }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchName = async () => {
      const oli = new OLIClient({
        attesters: {
          trustedAttesters: ['0x...'] // Your trusted sources
        }
      });
      await oli.init();
      
      const displayName = await oli.graphql.getDisplayName(address);
      setName(displayName);
      setLoading(false);
    };

    fetchName();
  }, [address]);

  if (loading) return <span>Loading...</span>;
  return <span>{name}</span>;
}
```

### React Hook (Reusable)

```tsx
import { useState, useEffect } from 'react';
import { OLIClient, helpers } from '@openlabels/sdk';

// Create client once
const oli = new OLIClient({
  attesters: { trustedAttesters: ['0x...'] }
});
oli.init();

// Reusable hook
export function useAddressLabel(address: string) {
  const [summary, setSummary] = useState<helpers.LabelSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    oli.graphql.getAddressSummary(address)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [address]);

  return { summary, loading };
}

// Usage
function MyComponent({ address }: { address: string }) {
  const { summary, loading } = useAddressLabel(address);
  
  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>{address}</div>;
  
  return (
    <div>
      <h3>{summary.name}</h3>
      <p>{summary.category} • {summary.formattedDate}</p>
    </div>
  );
}
```

### Vue Composable

```typescript
import { ref, onMounted } from 'vue';
import { OLIClient } from '@openlabels/sdk';

export function useAddressLabel(address: string) {
  const name = ref('');
  const loading = ref(true);

  onMounted(async () => {
    const oli = new OLIClient();
    await oli.init();
    name.value = await oli.graphql.getDisplayName(address);
    loading.value = false;
  });

  return { name, loading };
}
```

## 💡 Common Patterns

### Address Table with Labels

```typescript
const addresses = ['0x...', '0x...', '0x...'];

const oli = new OLIClient({
  attesters: { trustedAttesters: ['0x...'] }
});
await oli.init();

// Get summaries for all addresses
const summaries = await Promise.all(
  addresses.map(addr => oli.graphql.getAddressSummary(addr))
);

// Display in table
summaries.forEach(summary => {
  if (summary) {
    console.log(`${summary.name} | ${summary.category} | ${summary.formattedDate}`);
  }
});
```

### Label Explorer with Grouping

```typescript
const result = await oli.graphql.queryAttestations({ take: 100 });
const labels = result.data.attestations;

// Group by category
const grouped = new Map();
labels.forEach(label => {
  const category = label.usage_category || 'uncategorized';
  if (!grouped.has(category)) grouped.set(category, []);
  grouped.get(category).push(label);
});

// Display grouped
grouped.forEach((labels, category) => {
  console.log(`${category}: ${labels.length} labels`);
  labels.forEach(label => {
    console.log(`  - ${oli.helpers.getDisplayName(label)}`);
  });
});
```

### Autocomplete/Search

```typescript
// Get many labels for search
const result = await oli.graphql.queryAttestations({ take: 1000 });
const labels = await oli.graphql.getValidLabelsForAddress(address);

// Search by name
function searchLabels(query: string) {
  return labels.filter(label => {
    const name = oli.helpers.getDisplayName(label);
    return name.toLowerCase().includes(query.toLowerCase());
  });
}
```

## 🎯 Best Practices

### 1. Configure Once, Use Everywhere

```typescript
// ✅ Good - Configure at initialization
const oli = new OLIClient({
  attesters: { trustedAttesters: ['0x...'] },
  display: { addressFormat: 'short' }
});

// All methods automatically use these settings
const name1 = await oli.graphql.getDisplayName('0x...');
const name2 = await oli.graphql.getDisplayName('0x...');
```

### 2. Use the Right Convenience Level

```typescript
// ✅ For simple display
const name = await oli.graphql.getDisplayName(address);

// ✅ For rich UI
const summary = await oli.graphql.getAddressSummary(address);

// ✅ For multiple labels
const labels = await oli.graphql.getValidLabelsForAddress(address);

// ✅ For full control
const result = await oli.graphql.getLabelsForAddress(address);
```

### 3. Reuse Client Instances

```typescript
// ✅ Good - Create once
const oli = new OLIClient();
await oli.init();

async function getName1() { return oli.graphql.getDisplayName('0x...'); }
async function getName2() { return oli.graphql.getDisplayName('0x...'); }

// ❌ Bad - Creating multiple instances
async function getName() {
  const oli = new OLIClient();
  await oli.init(); // Fetches definitions every time!
  return oli.graphql.getDisplayName('0x...');
}
```

### 4. Handle Missing Labels Gracefully

```typescript
// ✅ Good - getDisplayName has built-in fallback
const name = await oli.graphql.getDisplayName(address);
// Returns formatted address if no label

// ✅ Good - Check for null
const summary = await oli.graphql.getAddressSummary(address);
if (summary) {
  console.log(summary.name);
} else {
  console.log('No label found');
}
```

## 🚀 Performance Tips

1. **Cache the client instance** - Don't create new clients repeatedly
2. **Use bulk queries** - Fetch multiple labels at once when possible
3. **Filter early** - Use configuration to avoid unnecessary data
4. **Batch API calls** - Use `Promise.all()` for multiple addresses

## 📚 More Examples

See the `/examples` directory for complete working examples:

- `advanced-usage.ts` - All features demonstrated
- `react-example.tsx` - React component patterns
- `basic-usage.ts` - Simple getting started
- `node-script.js` - Node.js integration

## 🆘 Need Help?

- 📖 [Full API Documentation](./README.md)
- 💬 [Community Discussions](https://github.com/openlabelsinitiative/OLI/discussions)
- 🐛 [Report Issues](https://github.com/openlabelsinitiative/OLI/issues)

