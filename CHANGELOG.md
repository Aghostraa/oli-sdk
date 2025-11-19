# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.1.0] - 2025-11-19

This is the first release of the refreshed `@openlabels/oli-sdk` package and serves as the new baseline for the relocated repository. The previously published `@openlabels/sdk@0.1.1` build has been deprecated on npm; use this `0.1.0` release going forward.

### Added
- REST-first, read-only `OLIClient` that wraps `/labels`, `/attestations`, `/analytics`, and proxy helpers.
- Dynamic schema + value-set loader (`DataFetcher`) that keeps the SDK aligned with the public OLI tag definitions without shipping new builds.
- Proxy helper for Next.js/Express apps that injects `x-api-key` without exposing credentials to the browser.
- Helper utilities for formatting addresses, selecting the best label by recency, and filtering labels per category/project/time window.
- Zod-powered runtime validation for critical REST responses.
- Documentation disclaimer describing how the public label pool, `getBestLabelForAddress`, and `getValidLabelsForAddress` should be treated until the upcoming trust algorithms land.


[0.1.0]: https://github.com/openlabelsinitiative/oli-sdk/releases/tag/v0.1.0
