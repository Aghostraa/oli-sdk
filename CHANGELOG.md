# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]


## [0.1.2] - 2025-12-20

### Added
- **`/validation` subpath** — Exposes all field-level validators (`validateAddressForChain`, `validateContractName`, `validateTxHash`, `validateURL`, `validateBoolean`, etc.) plus the new `DIAGNOSTIC_CODES` constant object for consumers who need to match on diagnostic `.code` strings without hardcoding literals.
- **`/chains` subpath** — Exposes chain metadata (`CHAINS`, `CHAIN_OPTIONS`, `CHAIN_ALIASES`), CAIP-10 utilities (`parseCaip10`, `buildCaip10`, `normalizeChainId`), address utilities (`isValidEvmAddress`, `toChecksumAddress`), and category data (`CATEGORIES`, `VALID_CATEGORY_IDS`, `convertCategoryAlias`).
- **`DIAGNOSTIC_CODES` constant** — Re-exported from the root `@openlabels/oli-sdk` and `@openlabels/oli-sdk/attest` subpaths. Covers all 31 diagnostic codes used internally by the validation and CSV pipeline.
- **`DiagnosticCode` type** — Derived union type of all `DIAGNOSTIC_CODES` values; exported alongside the constant.
- **`src/` shipped with the package** — Added `"src"` to the `files` array in `package.json` so TypeScript source maps resolve correctly in consumer debug sessions.

### Changed
- **Hook API restructured (breaking)** — `SingleAttestUIController` and `BulkCsvAttestUIController` return values are now grouped into namespaced sub-objects (`diagnostics`, `validation`, `submission`, `queue`, `csv`). See [docs/MIGRATION_HOOK_API.md](docs/MIGRATION_HOOK_API.md) for the complete flat → grouped mapping table and before/after code examples.
  - `validation.loading` → `validation.isRunning`
  - `submission.loading` → `submission.isSubmitting`
  - `csv.loading` → `csv.isLoading`
  - `validate(…)` → `validation.run(…)`
  - `prepare(…)` → `submission.prepare(…)`
  - `submit(…)` → `submission.submit(…)`
  - `parseCsvText(…)` → `csv.parse(…)`
  - `applySuggestion(…)` → `diagnostics.applySuggestion(…)`
  - `applyDiagnosticSuggestion(…)` → `diagnostics.applyFromDiagnostic(…)`
  - `rows`, `columns`, `setRows`, `setColumns`, `setCell`, `addRow`, `removeRow` → moved under `queue.*`
  - `getRowDiagnostics(…)` → `diagnostics.getRow(…)`
  - `getFieldDiagnostics(…)` → `diagnostics.getField(…)`
  - `getFieldError(…)` → `diagnostics.getFieldError(…)`
- **DTS bundling** — Changed tsup `dts` option from `true` to `{ resolve: true }` to inline all shared types directly into each entry-point declaration file, eliminating hash-named chunk files (`api-*.d.ts`, `types-*.d.ts`).
- **JSDoc** — Added or improved documentation on `AttestClient` methods, `createDynamicWalletAdapter`, `OnchainWalletAdapter`, `submitProjectContribution`, `SubmitProjectContributionInput`, all validator functions, CAIP utilities, and address helpers.

### Fixed
- Private-property type conflicts when consumers compose SDK types — resolved by the DTS `resolve: true` change above.

### Tests
- Added `tests/consumer/type-check.ts` — a type-only integration test that imports from every public subpath as a downstream consumer would and confirms type correctness via `tsc --noEmit`.
- Added `npm run test:types` script.


## [0.1.1] - 2025-12-05

### Added
- **Attestation UI hooks** — `useSingleAttestUI` and `useBulkCsvAttestUI` React hooks with configurable single/bulk attestation workflows, inline diagnostics, and suggestion application.
- **React UI components** — `SingleAttestForm` and `BulkCsvTable` headless components built on top of the UI hooks.
- **`SingleAttestModule` / `BulkCsvAttestModule`** — Render-prop wrappers for the UI hooks; compatible with any React tree without prop-drilling the `AttestClient`.
- **`/attest-ui` subpath** — Dedicated entry point for the React UI layer; peer-dependency on React ≥ 18, optional.
- **Scoped diagnostics helpers** — `getFieldDiagnostics`, `getRowDiagnostics`, and `getFieldError` on the bulk controller for fine-grained per-cell error display.
- **Stable row remap algorithm** — Diagnostics follow rows across edits using a two-pass strict + relaxed row-index mapping so error indicators don't jump after row mutations.


## [0.1.0] - 2025-11-19

This is the first release of the refreshed `@openlabels/oli-sdk` package and serves as the new baseline for the relocated repository. The previously published `@openlabels/sdk@0.1.1` build has been deprecated on npm; use this `0.1.0` release going forward.

### Added
- REST-first, read-only `OLIClient` that wraps `/labels`, `/attestations`, `/analytics`, and proxy helpers.
- Dynamic schema + value-set loader (`DataFetcher`) that keeps the SDK aligned with the public OLI tag definitions without shipping new builds.
- Proxy helper for Next.js/Express apps that injects `x-api-key` without exposing credentials to the browser.
- Helper utilities for formatting addresses, selecting the best label by recency, and filtering labels per category/project/time window.
- Zod-powered runtime validation for critical REST responses.
- Documentation disclaimer describing how the public label pool, `getBestLabelForAddress`, and `getValidLabelsForAddress` should be treated until the upcoming trust algorithms land.


[Unreleased]: https://github.com/openlabelsinitiative/oli-sdk/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/openlabelsinitiative/oli-sdk/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/openlabelsinitiative/oli-sdk/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/openlabelsinitiative/oli-sdk/releases/tag/v0.1.0
