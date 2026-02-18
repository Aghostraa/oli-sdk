# Attestation Environment Variables

## Runtime (SDK / App)

- `OLI_COINBASE_PAYMASTER_URL`
  - SDK-level override for Coinbase paymaster endpoint.
  - Recommended when using `@openlabels/oli-sdk` across server/browser builds.

- `NEXT_PUBLIC_COINBASE_PAYMASTER_URL`
  - Frontend-compatible fallback (same variable used by `oli-frontend`).
  - Used if `OLI_COINBASE_PAYMASTER_URL` is unset.

If both are unset, SDK uses the built-in Coinbase Base default endpoint.

## Test Variables

- `RUN_LIVE_TESTS=1`
  - Enables existing live read API smoke test.

- `RUN_DYNAMIC_E2E=1`
  - Optional flag for CI/workflows where you only want Dynamic e2e harness tests.
  - (Current harness tests are deterministic mocks and run safely by default.)

## Recommended `.env` for attestation apps

```bash
# Preferred SDK variable
OLI_COINBASE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/<your-key>

# Optional frontend-compatible alias
NEXT_PUBLIC_COINBASE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/<your-key>
```
