# OLI SDK

> TypeScript/JavaScript SDK for querying Open Labels Initiative (OLI) address labels on-chain and off-chain

[![npm version](https://img.shields.io/npm/v/@openlabels/sdk.svg)](https://www.npmjs.com/package/@openlabels/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The OLI SDK provides a simple, type-safe way to query blockchain address labels from the Open Labels Initiative. Perfect for frontends, analytics tools, and any application that needs to retrieve and display address metadata.

## ✨ Features

- 🔄 **Dynamic Types**: Tag definitions and value sets are fetched from GitHub at runtime, so you're always up-to-date
- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Easy to Use**: Simple API for querying labels by address, attester, or time
- 🌐 **Multi-Chain**: Supports Base, Optimism, Ethereum, and custom networks
- 📦 **Lightweight**: Minimal dependencies, browser and Node.js compatible
- ⚡ **Fast**: Efficient GraphQL queries with built-in data expansion

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

```typescript
import { OLIClient } from '@openlabels/sdk';

// Create and initialize client
const oli = new OLIClient();
await oli.init();

// Query labels for an address
const labels = await oli.graphql.getLabelsForAddress('0x1234...');
console.log(labels.data.attestations);
```

## 📖 Usage Examples

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
// Get all labels for an address
const result = await oli.graphql.getLabelsForAddress('0x1234...');

// Access the labels
for (const attestation of result.data.attestations) {
  console.log('Label:', attestation.address_name);
  console.log('Tagged by:', attestation.attester);
  console.log('Usage category:', attestation.usage_category);
}

// With pagination
const recent = await oli.graphql.getLabelsForAddress('0x1234...', { take: 10 });
```

### Query Labels by Attester

```typescript
// Get all labels created by a specific attester
const result = await oli.graphql.getLabelsByAttester('0xabcd...');

for (const label of result.data.attestations) {
  console.log('Labeled address:', label.recipient);
  console.log('Label name:', label.address_name);
}
```

### Advanced Queries

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

- `graphql: GraphQLClient` - GraphQL query client
- `fetcher: DataFetcher` - Data fetching utilities
- `tagDefinitions: TagDefinitions` - Loaded tag definitions
- `valueSets: ValueSets` - Loaded value sets

### `GraphQLClient`

Client for querying attestations via GraphQL.

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

## 🤝 Contributing

Contributions are welcome! Please see the main [OLI repository](https://github.com/openlabelsinitiative/OLI) for contribution guidelines.

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

