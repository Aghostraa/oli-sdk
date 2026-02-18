# OLI SDK Attestation API (`oli.attest.*`)

The SDK now exposes a write namespace on every `OLIClient` instance:

```ts
const oli = new OLIClient();
await oli.init();

oli.attest.prepareSingleAttestation(...)
oli.attest.validateSingle(...)
oli.attest.submitSingleOnchain(...)
oli.attest.parseCsv(...)
oli.attest.validateBulk(...)
oli.attest.applySuggestion(...)
oli.attest.submitBulkOnchain(...)
```

## Mode Profiles

- `simpleProfile`
- `advancedProfile`

Pass via `{ mode }` on validation/prepare APIs.

## Single Attestation

```ts
const validation = await oli.attest.validateSingle(input, { mode: 'simpleProfile' });
const prepared = await oli.attest.prepareSingleAttestation(input, { mode: 'simpleProfile' });
const tx = await oli.attest.submitSingleOnchain(prepared, walletAdapter);
```

## Bulk CSV + Rows

```ts
const parsed = await oli.attest.parseCsv(csvText);
const fixedRow = oli.attest.applySuggestion(parsed.rows[0], 'usage_category', 'dex');
const bulkValidation = await oli.attest.validateBulk(parsed.rows, { mode: 'advancedProfile' });
const tx = await oli.attest.submitBulkOnchain(bulkValidation.validRows, walletAdapter);
```

## Diagnostics Shape

All validation/parsing APIs emit structured diagnostics:

- `errors[]`
- `warnings[]`
- `conversions[]`
- `suggestions[]`

Each diagnostic contains:

- `code`
- `message`
- optional `row`
- optional `field`
- optional `suggestion` / `suggestions[]`

## Wallet/Transport

Use any adapter implementing `OnchainWalletAdapter`. For Dynamic wallets:

```ts
import { createDynamicWalletAdapter } from '@openlabels/oli-sdk';

const adapter = createDynamicWalletAdapter(primaryWallet);
```

Transport behavior:

- Network switch + supported network checks
- `attest` / `multiAttest`
- Sponsored path attempt (Coinbase Smart Wallet on Base), then automatic regular fallback
- Normalized tx result (`status`, `txHash`, `uids[]`)

## Guardrails

- Max `50` rows per bulk submission
- Required field validation (`chain_id`, `address`)
- CAIP parsing + chain normalization
- Category/paymaster/project suggestions and corrections aligned to frontend behavior
