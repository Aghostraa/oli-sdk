# OLI SDK Developer Experience Features

## 🎉 Summary of Improvements

The SDK has been completely redesigned with developer experience as the top priority. Here's what makes it amazing:

## ✨ Key Features

### 1. **Plug & Play Simplicity**

```typescript
// Before: Complex parsing and field checking
const result = await oli.graphql.getLabelsForAddress('0x...');
const label = result.data.attestations[0];
const name = label.contract_name || label.address_name || formatAddress(label.recipient);

// After: One line!
const name = await oli.graphql.getDisplayName('0x...');
```

### 2. **Smart Configuration**

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

### 3. **Convenience Methods** (Multiple Levels)

**Level 1: Simplest** - Just get a name
```typescript
const name = await oli.graphql.getDisplayName('0x...');
```

**Level 2: Formatted Summary** - All info ready for UI
```typescript
const summary = await oli.graphql.getAddressSummary('0x...');
// Returns: { name, category, formattedDate, formattedAddress, ... }
```

**Level 3: Best Label** - Auto-filtered & ranked
```typescript
const label = await oli.graphql.getBestLabelForAddress('0x...');
```

**Level 4: All Valid Labels** - Filtered, ranked, sorted
```typescript
const labels = await oli.graphql.getValidLabelsForAddress('0x...');
```

**Level 5: Raw Data** - Maximum control
```typescript
const result = await oli.graphql.getLabelsForAddress('0x...');
```

### 4. **Helper Utilities**

Built-in formatters and validators:

```typescript
// Display formatting
helpers.getDisplayName(label);              // Smart name resolution
helpers.formatAddress('0x...', 'short');    // "0x1234...5678"
helpers.formatTimestamp(ts, 'relative');    // "2 hours ago"

// Validation
helpers.isLabelValid(label);                // Check if valid
helpers.isAttesterTrusted(attester, config); // Check trust

// Filtering & Ranking
helpers.filterLabels(labels, config);       // Apply filters
helpers.rankLabels(labels, config);         // Sort by priority
helpers.getBestLabel(labels, config);       // Get top result
```

### 5. **No More Field Confusion**

The SDK automatically handles all field naming variations:
- `contract_name` vs `address_name`
- `erc20.name`, `erc721.name`
- Nested `tags_json` parsing
- BigNumber conversions
- Empty value handling

**You never have to worry about which field to use!**

### 6. **Smart Defaults**

Everything works out of the box with sensible defaults:
- Auto-ranks by trust and recency
- Filters out revoked labels
- Uses short address format
- Shows relative timestamps
- Handles missing data gracefully

### 7. **Type Safety**

Full TypeScript support with proper types:
- `AttesterConfig` - Trust configuration
- `LabelDisplayConfig` - Display preferences
- `LabelFilterConfig` - Filter settings
- `LabelSummary` - Formatted output
- Dynamic tag types (fetched from GitHub)

## 📝 Before & After Examples

### Getting a Display Name

**Before:**
```typescript
const result = await oli.graphql.getLabelsForAddress('0x...');
const labels = result.data.attestations;
if (labels.length > 0) {
  const label = labels[0];
  const name = label.contract_name || 
                label.address_name || 
                label['erc20.name'] || 
                `${label.recipient.slice(0, 6)}...${label.recipient.slice(-4)}`;
  console.log(name);
}
```

**After:**
```typescript
const name = await oli.graphql.getDisplayName('0x...');
console.log(name);
```

### Filtering by Trusted Attesters

**Before:**
```typescript
const result = await oli.graphql.getLabelsForAddress('0x...');
const trustedAttesters = ['0x...', '0x...'];
const filtered = result.data.attestations.filter(label => 
  trustedAttesters.includes(label.attester.toLowerCase())
);
const sorted = filtered.sort((a, b) => b.timeCreated - a.timeCreated);
```

**After:**
```typescript
// Configure once
const oli = new OLIClient({
  attesters: { trustedAttesters: ['0x...', '0x...'] }
});

// Use anywhere - automatically filtered!
const labels = await oli.graphql.getValidLabelsForAddress('0x...');
```

### Display Formatting

**Before:**
```typescript
const label = /* ... */;
const name = label.contract_name || 'Unknown';
const address = `${label.recipient.slice(0, 6)}...${label.recipient.slice(-4)}`;
const date = new Date(label.timeCreated * 1000).toLocaleString();
const attester = `${label.attester.slice(0, 6)}...${label.attester.slice(-4)}`;
```

**After:**
```typescript
const summary = await oli.graphql.getAddressSummary('0x...');
// Everything is already formatted!
console.log(summary.name);               // "Uniswap Router"
console.log(summary.formattedAddress);   // "0x1234...5678"
console.log(summary.formattedDate);      // "2 hours ago"
console.log(summary.formattedAttester);  // "0xabcd...ef01"
```

## 🎯 Use Cases Solved

### ✅ Address Display Component
```typescript
const name = await oli.graphql.getDisplayName(address);
return <span>{name}</span>;
```

### ✅ Label Explorer with Filters
```typescript
const oli = new OLIClient({
  filters: { allowedCategories: ['dex', 'bridge'] }
});
const labels = await oli.graphql.getValidLabelsForAddress(address);
```

### ✅ Trusted Label Verification
```typescript
const oli = new OLIClient({
  attesters: { trustedAttesters: ['0xYourTrustedSource'] }
});
const label = await oli.graphql.getBestLabelForAddress(address);
// Automatically only from trusted sources!
```

### ✅ Rich UI Display
```typescript
const summary = await oli.graphql.getAddressSummary(address);
// All data formatted and ready for UI
```

### ✅ Label Ranking
```typescript
const oli = new OLIClient({
  attesters: { 
    attesterPriority: ['0xMostTrusted', '0xSecondMost'] 
  },
  autoRank: true
});
// Labels automatically sorted by your preferences
```

## 📦 What's Included

### New Files:
- `src/helpers.ts` - Utility functions
- `DEVELOPER_EXPERIENCE.md` - Complete DX guide
- `examples/advanced-usage.ts` - Comprehensive examples
- `test-simple.html` - Interactive demo
- `FEATURES_SUMMARY.md` - This file

### Enhanced Files:
- `src/client.ts` - Configuration support
- `src/graphql.ts` - Convenience methods
- `src/types/common.ts` - Config types
- `src/index.ts` - Helper exports

## 🚀 Getting Started

### Install
```bash
npm install @openlabels/sdk
```

### Basic Usage
```typescript
import { OLIClient } from '@openlabels/sdk';

const oli = new OLIClient();
await oli.init();

// Just works!
const name = await oli.graphql.getDisplayName('0x...');
```

### With Configuration
```typescript
const oli = new OLIClient({
  attesters: { trustedAttesters: ['0x...'] },
  display: { dateFormat: 'relative' },
  filters: { allowedCategories: ['dex'] }
});
await oli.init();

// All queries automatically use your config
const summary = await oli.graphql.getAddressSummary('0x...');
```

## 📚 Documentation

- [Developer Experience Guide](./DEVELOPER_EXPERIENCE.md) - Complete feature documentation
- [Getting Started](./GETTING_STARTED.md) - Quick start guide
- [Advanced Examples](./examples/advanced-usage.ts) - Code examples
- [README](./README.md) - Full API reference

## 🎨 Test It

1. Build: `npm run build`
2. Serve: `npx serve .`
3. Open: `http://localhost:3000/test-simple.html`

Experience the new developer-friendly API!

## 💡 Philosophy

**Before**: You had to understand OLI's data structure to use it
**After**: The SDK handles complexity, you focus on your app

**Before**: Different use cases required different code patterns
**After**: One SDK, multiple convenience levels for every need

**Before**: Configuration scattered across codebase
**After**: Configure once, applies everywhere automatically

## ⭐ Result

A truly plug-and-play SDK that makes working with OLI labels effortless!

