# Getting Started with OLI SDK

This guide will help you get up and running with the OLI SDK in just a few minutes.

## Installation

```bash
npm install @openlabels/sdk
```

Or with yarn:
```bash
yarn add @openlabels/sdk
```

Or with pnpm:
```bash
pnpm add @openlabels/sdk
```

## Quick Start (5 minutes)

### Step 1: Import and Initialize

```typescript
import { OLIClient } from '@openlabels/sdk';

// Create client
const oli = new OLIClient();

// Initialize (loads tag definitions)
await oli.init();
```

### Step 2: Query Labels for an Address

```typescript
// Get labels for a specific address
const result = await oli.graphql.getLabelsForAddress(
  '0x1234567890123456789012345678901234567890'
);

// Access the labels
const labels = result.data.attestations;
console.log(`Found ${labels.length} labels`);

// Print first label
if (labels.length > 0) {
  console.log('Label name:', labels[0].address_name);
  console.log('Category:', labels[0].usage_category);
}
```

### Step 3: Explore Available Tags

```typescript
// Get all available tag IDs
const tagIds = oli.getTagIds();
console.log('Available tags:', tagIds);

// Get details for a specific tag
const tag = oli.getTag('usage_category');
console.log('Tag description:', tag.description);

// Get valid values for a tag
const validCategories = oli.getValidValues('usage_category');
console.log('Valid categories:', validCategories);
```

That's it! You're now using the OLI SDK 🎉

## Common Use Cases

### Use Case 1: Display Human-Readable Address Names

```typescript
async function getAddressDisplayName(address: string): Promise<string> {
  const oli = new OLIClient();
  await oli.init();
  
  const result = await oli.graphql.getLabelsForAddress(address, { take: 1 });
  
  if (result.data.attestations.length > 0) {
    return result.data.attestations[0].address_name || address;
  }
  
  return address;
}

// Usage
const name = await getAddressDisplayName('0x1234...');
console.log(name); // "Uniswap Router" or "0x1234..."
```

### Use Case 2: Filter by Category

```typescript
// Get all DEX-related labels
const result = await oli.graphql.queryAttestations({ take: 100 });
const dexLabels = result.data.attestations.filter(
  label => label.usage_category === 'dex'
);

console.log(`Found ${dexLabels.length} DEX labels`);
```

### Use Case 3: Validate User Input

```typescript
// Validate a usage category before submitting
function validateCategory(category: string): boolean {
  return oli.validateValue('usage_category', category);
}

// Usage in a form
const userInput = 'dex';
if (validateCategory(userInput)) {
  console.log('Valid category!');
} else {
  console.log('Invalid category. Please choose from:', 
    oli.getValidValues('usage_category')
  );
}
```

### Use Case 4: Build an Address Autocomplete

```typescript
async function searchLabels(query: string) {
  const oli = new OLIClient();
  await oli.init();
  
  // Get recent labels
  const result = await oli.graphql.queryAttestations({ take: 1000 });
  
  // Filter by query
  const matches = result.data.attestations.filter(label =>
    label.address_name?.toLowerCase().includes(query.toLowerCase()) ||
    label.recipient.toLowerCase().includes(query.toLowerCase())
  );
  
  return matches;
}

// Usage
const results = await searchLabels('uniswap');
results.forEach(label => {
  console.log(`${label.address_name} (${label.recipient})`);
});
```

## Network Configuration

### Use Different Networks

```typescript
// Base (default)
const oli = new OLIClient({ network: 'BASE' });

// Optimism
const oli = new OLIClient({ network: 'OPTIMISM' });

// Ethereum Mainnet
const oli = new OLIClient({ network: 'ETHEREUM' });

// Custom network
const oli = new OLIClient({
  network: {
    name: 'custom',
    graphqlEndpoint: 'https://custom.easscan.org/graphql',
    schemaId: '0x...'
  }
});
```

## Advanced Queries

### Query with Multiple Filters

```typescript
// Get labels by a specific attester, created after a timestamp
const result = await oli.graphql.queryAttestations({
  attester: '0xabcd...',
  timeCreated: 1640000000,
  take: 50
});
```

### Get Specific Attestation by ID

```typescript
const result = await oli.graphql.queryAttestations({
  id: '0x123abc...'
});
```

### Query Non-Revoked Labels Only

```typescript
const result = await oli.graphql.queryAttestations({ take: 100 });
const activeLabels = result.data.attestations.filter(
  label => !label.revoked
);
```

## Working with Bulk Data

### Download Full Label Dataset

```typescript
// Get all labels (decoded format)
const allLabels = await oli.fetcher.getFullDecodedExport();
console.log(`Total labels: ${allLabels.length}`);

// Process in bulk
allLabels.forEach(label => {
  // Your processing logic
  console.log(label.address_name, label.recipient);
});
```

### Export to CSV

```typescript
const labels = await oli.fetcher.getFullDecodedExport();

// Convert to CSV (pseudo-code)
const csv = [
  'Address,Name,Category,Attester',
  ...labels.map(l => `${l.recipient},${l.address_name},${l.usage_category},${l.attester}`)
].join('\n');

console.log(csv);
```

## Framework Integration

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { OLIClient, ExpandedAttestation } from '@openlabels/sdk';

export function useAddressLabel(address: string) {
  const [label, setLabel] = useState<ExpandedAttestation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabel = async () => {
      const oli = new OLIClient();
      await oli.init();
      
      const result = await oli.graphql.getLabelsForAddress(address, { take: 1 });
      
      if (result.data.attestations.length > 0) {
        setLabel(result.data.attestations[0]);
      }
      
      setLoading(false);
    };

    fetchLabel();
  }, [address]);

  return { label, loading };
}

// Usage
function AddressDisplay({ address }: { address: string }) {
  const { label, loading } = useAddressLabel(address);
  
  if (loading) return <span>Loading...</span>;
  
  return <span>{label?.address_name || address}</span>;
}
```

### Vue Composable

```typescript
import { ref, onMounted } from 'vue';
import { OLIClient } from '@openlabels/sdk';

export function useOLI() {
  const oli = ref<OLIClient | null>(null);
  const loading = ref(true);

  onMounted(async () => {
    const client = new OLIClient();
    await client.init();
    oli.value = client;
    loading.value = false;
  });

  return { oli, loading };
}
```

## Best Practices

### 1. Reuse Client Instance

```typescript
// ✅ Good - Create once, reuse
const oli = new OLIClient();
await oli.init();

async function getLabel1() {
  return oli.graphql.getLabelsForAddress('0x...');
}

async function getLabel2() {
  return oli.graphql.getLabelsForAddress('0x...');
}

// ❌ Bad - Creating multiple instances
async function getLabel() {
  const oli = new OLIClient();
  await oli.init(); // Fetches definitions again
  return oli.graphql.getLabelsForAddress('0x...');
}
```

### 2. Handle Initialization

```typescript
// Ensure client is initialized before use
if (!oli.isInitialized()) {
  await oli.init();
}
```

### 3. Error Handling

```typescript
try {
  const result = await oli.graphql.getLabelsForAddress('0x...');
  // Handle result
} catch (error) {
  console.error('Failed to fetch labels:', error);
  // Handle error gracefully
}
```

### 4. Pagination for Large Datasets

```typescript
// Use 'take' to limit results
const result = await oli.graphql.queryAttestations({ take: 100 });

// For pagination, use timeCreated cursor
const page1 = await oli.graphql.queryAttestations({ take: 100 });
const lastTimestamp = page1.data.attestations[99].timeCreated;

const page2 = await oli.graphql.queryAttestations({ 
  take: 100,
  timeCreated: lastTimestamp 
});
```

## Troubleshooting

### "OLI client not initialized"

Make sure to call `await oli.init()` before using the client:

```typescript
const oli = new OLIClient();
await oli.init(); // Don't forget this!
```

### No Labels Found

Some addresses may not have any labels yet. Always check:

```typescript
const result = await oli.graphql.getLabelsForAddress('0x...');

if (result.data.attestations.length === 0) {
  console.log('No labels found for this address');
}
```

### Network Issues

If you're having network issues, ensure:
- You have internet connectivity
- The GraphQL endpoint is accessible
- CORS is configured if using in browser

## Next Steps

- Explore the full [API Reference](./README.md#-api-reference)
- Check out more [Examples](./examples/)
- Learn about [Contributing](./CONTRIBUTING.md)
- Read the [Changelog](./CHANGELOG.md)

## Need Help?

- 📖 [Full Documentation](./README.md)
- 💬 [Community Discussions](https://github.com/openlabelsinitiative/OLI/discussions)
- 🐛 [Report Issues](https://github.com/openlabelsinitiative/OLI/issues)

Happy coding! 🚀

