# Changelog

All notable changes to the OLI SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-16

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

