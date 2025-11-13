# Changelog

All notable changes to the OLI SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Label helpers now rank purely by validity + recency; attester/trust configuration was removed pending a future redesign.

### Removed
- GraphQL client, write helpers, and legacy docs (ARCHITECTURE.md, SCHEMA_EVOLUTION_GUIDE.md, docs/MIGRATION_GUIDE_v0_1_0.md) to keep the SDK read-only and REST-centric
- Trust-specific configuration (`attesters`, `autoRank`, trust list weighting) — trust tooling will return in a future release with a simpler design.

## [0.1.1] - 2025-11-05

### Fixed
- Aligned attestation query parameters with OpenAPI specification to ensure proper API compatibility

## [0.1.0] - 2025-11-05

### Added
- Advanced REST filters (`recipient`, `attester`, `schema_id`, `data_contains`, `since/until`, pagination)
- High-level helpers: `getLatestAttestations`, `searchAttestations`, `getAttesterLeaderboard`, `getTagBreakdown`, `getAttestationsForAddresses`
- Built-in request deduplication and opt-in caching (`enableCache`, `cacheTtl`, `staleWhileRevalidate`)
- Runtime response validation via Zod with descriptive error messages
- `createProxyHandler` middleware for Next.js/Express environments
- Migration guide ([docs/MIGRATION_GUIDE_v0_1_0.md](docs/MIGRATION_GUIDE_v0_1_0.md))

### Changed
- `RestClient` now returns validated, expanded data for all helpers
- GraphQL helpers marked `@deprecated` in TypeScript and documentation updated to REST-first
- README quick start refreshed with API-key env vars, proxy setup, and new helper examples
- Test suite expanded to cover caching, search, analytics, and fallback behaviour

### Fixed
- Error parsing when REST endpoints return non-JSON error bodies
- Tag breakdown fallback now normalises values and honours `chain_id`

## [0.0.2] - 2025-10-31

### Added
- REST API client (`RestClient`) with full API support
- Convenience methods: `getDisplayName()`, `getAddressSummary()`, `getBestLabelForAddress()`, `getValidLabelsForAddress()`
- REST API configuration via `api` config option
- Support for `/labels`, `/labels/bulk`, `/addresses/search`, `/attestations`, and `/analytics/attesters` endpoints
- Node.js demo script (`demo-node.js`) for testing without CORS issues
- Enhanced error handling with CORS detection and helpful messages
- Developer experience features section in README

### Changed
- Updated demo.html to work with new REST API endpoints
- Consolidated documentation (merged GETTING_STARTED.md, DEVELOPER_GUIDE.md, TYPESCRIPT_GENERICS_FEATURE.md into README.md)
- Improved README with Quick Start guide and convenience methods documentation
- Updated API configuration structure to use `api.apiKey` and `api.baseUrl`

### Fixed
- Fixed CORS issues in browser demo with better error messages and Node.js alternative
- Removed circular dependency in package.json
- Fixed demo.html to use updated SDK API structure

### Removed
- Removed redundant documentation files (GETTING_STARTED.md, DEVELOPER_GUIDE.md, ANSWER_SCHEMA_CHANGES.md, TYPESCRIPT_GENERICS_FEATURE.md)
- Removed test HTML files (test.html, test-simple.html, test-cdn.html)
- Removed test JavaScript/TypeScript files (test-generics.js, test-generics.ts, test-generics-typed.ts, test-graphql.js, test-schema-resilience.js)
- Removed build artifact (openlabels-sdk-1.0.0.tgz)

## [0.0.1] - 2025-10-16

### Added
- Initial release of OLI SDK
- `OLIClient` class for managing client state and initialization
- `DataFetcher` module for fetching tag definitions and value sets from GitHub
- `GraphQLClient` module for querying attestations from EAS
- Dynamic type system that fetches definitions at runtime
- Support for Base, Optimism, and Ethereum networks
- Comprehensive TypeScript type definitions
- Helper methods for validation and value lookups
- Full documentation and examples
- React component examples
- Basic usage examples

### Features
- Query labels by address
- Query labels by attester
- Query labels with custom filters
- Get tag definitions dynamically from GitHub
- Get value sets for enumerated fields
- Validate values against allowed sets
- Export full label datasets
- Automatic JSON expansion for decoded attestation data

[1.0.0]: https://github.com/openlabelsinitiative/OLI/releases/tag/oli-sdk-v1.0.0
