# OLI SDK Architecture

## **OLI SDK - How It Works**

The **OLI (Open Labels Initiative) SDK** is a TypeScript/JavaScript library for querying blockchain address labels. It provides an easy way to fetch and work with on-chain attestations about Ethereum addresses (like contract names, categories, and metadata).

---

## **Core Architecture**

### **1. Main Entry Point - `src/index.ts`**
This is the package's public API. It exports:
- The main `OLIClient` class
- All TypeScript types
- Helper utilities

### **2. Client Class - `src/client.ts`** ⭐ **Most Important**
The `OLIClient` is the main interface users interact with. Key features:

**Initialization Flow:**
```typescript
const oli = new OLIClient();
await oli.init();  // Must call init() before use!
```

**What `init()` does:**
1. Fetches tag definitions from GitHub (YAML file)
2. Loads value sets (allowed values for each tag)
3. Makes the client ready for queries

**Key Components:**
- `graphql`: For querying attestations from EAS (Ethereum Attestation Service)
- `fetcher`: For fetching tag definitions and bulk data exports
- `tagDefinitions`: Loaded tag schemas (dynamic from GitHub)
- `valueSets`: Allowed values for enumerated tags

---

## **3. Three Main Modules**

### **A. GraphQL Client - `src/graphql.ts`**
Handles all queries to the EAS GraphQL API:

**Core Methods:**
- `queryAttestations()` - General-purpose query with filters
- `getLabelsForAddress()` - Get all labels for an address
- `getLabelsByAttester()` - Get labels created by someone
- `getBestLabelForAddress()` - Smart method that filters & ranks
- `getDisplayName()` - Quick way to get a name for an `address`

**Key Feature - JSON Expansion:**
Attestations store data as encoded JSON. The `expandDecodedDataJson()` method:
1. Parses the `decodedDataJson` field
2. Extracts nested values
3. Flattens them into top-level properties
3. Handles special cases like BigNumber hex values

```typescript
// Raw: { decodedDataJson: '[{"name":"address_name","value":{"value":"Uniswap"}}]' }
// Expanded: { address_name: "Uniswap", usage_category: "dex", ... }
```

### **B. Data Fetcher - `src/fetcher.ts`**
Fetches dynamic data from external sources:

**Methods:**
- `getOLITags()` - Fetches tag definitions from GitHub (YAML)
- `getOLIValueSets()` - Builds allowed values for each tag
- `getFullRawExport()` - Downloads all labels from growthepie API
- `getFullDecodedExport()` - Downloads decoded labels
- `isValidValue()` - Validates values against schemas

**Data Sources:**
1. **GitHub** - Tag definitions (YAML) and usage categories
2. **growthepie API** - Bulk exports and project lists

### **C. Helpers - `src/helpers.ts`**
Utility functions for working with labels:

**Display Functions:**
- `getDisplayName()` - Smart name extraction with fallbacks
- `formatAddress()` - Truncate addresses (short/medium/full)
- `formatTimestamp()` - Relative time ("2 hours ago")

**Filtering & Ranking:**
- `filterLabels()` - Apply category/project/age filters
- `rankLabels()` - Sort by attester priority, recency, revocation status
- `isAttesterTrusted()` - Check whitelist/blacklist
- `getBestLabel()` - Complete filtering + ranking pipeline
- `isLabelValid()` - Check if expired or revoked

---

## **4. Type System - `src/types/`**

### **`types/attestation.ts`**
Defines attestation data structures:
- `RawAttestation` - Direct from GraphQL
- `ExpandedAttestation` - After JSON expansion (flexible, allows dynamic fields)
- `AttestationFilters` - Query parameters

### **`types/common.ts`**
Network configurations and SDK options:
- `NETWORKS` - Built-in configs for Base, Optimism, Ethereum
- `OLIConfig` - SDK initialization options
- `AttesterConfig`, `LabelDisplayConfig`, `LabelFilterConfig`

### **`types/tags.ts`**
Tag definition structures:
- `TagDefinition` - Schema for an OLI tag
- `TagDefinitions` - Dictionary of all tags
- `ValueSets` - Allowed values per tag

### **`types/client.ts`**
Interface definition for the OLI client

---

## **Key Concepts**

### **🔄 Dynamic Types**
Unlike traditional SDKs, this doesn't hardcode types:
- Tag definitions are fetched at runtime from GitHub
- When new tags are added to OLI, apps automatically recognize them
- No SDK updates needed when the schema evolves

### **📦 Multi-Source Data Flow**
```
User App
   ↓
OLIClient.init()
   ↓
   ├→ GitHub (fetch tag definitions YAML)
   ├→ GitHub (fetch usage_category valueset YAML)  
   └→ growthepie (fetch owner_project values)
   
User queries address
   ↓
GraphQLClient.getLabelsForAddress()
   ↓
EAS GraphQL API (Base/Optimism/Ethereum)
   ↓
Expand JSON + Filter + Rank
   ↓
Return best label
```

### **🎯 Smart Label Selection**
The SDK has sophisticated logic for choosing the "best" label:
1. Filter out revoked/expired labels
2. Check attester trust (whitelist/blacklist)
3. Apply category/project filters
4. Rank by attester priority
5. Rank by recency
6. Return top result

---

## **Build Configuration**

### **`package.json`**
- Built with **tsup** for modern bundling
- Dual format: CommonJS (`dist/index.js`) + ESM (`dist/index.mjs`)
- TypeScript definitions: `dist/index.d.ts`
- Dependencies: `js-yaml` for parsing YAML tag definitions

### **`tsup.config.ts`**
Configures the build process (generates both CJS and ESM bundles)

---

## **Important Files Summary**

| File | Purpose |
|------|---------|
| `src/client.ts` | ⭐ Main SDK client - orchestrates everything |
| `src/graphql.ts` | Queries EAS attestations, expands JSON data |
| `src/fetcher.ts` | Fetches tag definitions and bulk exports |
| `src/helpers.ts` | Utilities for filtering, ranking, formatting |
| `src/index.ts` | Package entry point & exports |
| `src/types/attestation.ts` | Attestation data structures |
| `src/types/common.ts` | Network configs, SDK options |
| `src/types/tags.ts` | Tag definition structures |
| `src/types/client.ts` | Interface definition for the OLI client |
| `package.json` | Package metadata & build scripts |
| `dist/` | Compiled output (CJS + ESM + types) |

The SDK is well-architected with clear separation of concerns: client orchestration, GraphQL queries, data fetching, and helper utilities are all modular and testable!


