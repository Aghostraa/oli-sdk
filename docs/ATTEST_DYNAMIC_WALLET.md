# Dynamic Wallet Integration Guide

## 1. Build Adapter

```ts
import { createDynamicWalletAdapter } from '@openlabels/oli-sdk';

const walletAdapter = createDynamicWalletAdapter(primaryWallet, {
  paymasterUrl: process.env.NEXT_PUBLIC_COINBASE_PAYMASTER_URL
});
```

## 2. Submit Single Onchain

```ts
const prepared = await oli.attest.prepareSingleAttestation(input, {
  mode: 'simpleProfile'
});

const result = await oli.attest.submitSingleOnchain(prepared, walletAdapter);
```

## 3. Submit Bulk Onchain

```ts
const parsed = await oli.attest.parseCsv(csvText);
const validated = await oli.attest.validateBulk(parsed.rows, { mode: 'advancedProfile' });

if (validated.valid) {
  const result = await oli.attest.submitBulkOnchain(validated.validRows, walletAdapter);
  console.log(result.uids);
}
```

## Runtime Behavior

- Verifies supported attestation network before writes
- Switches wallet network before submitting
- Detects sponsorship eligibility (Coinbase Smart Wallet + Base)
- Attempts sponsored submission first when available
- Falls back to regular transaction path automatically on sponsored failure
- Normalizes output as:
  - `status`
  - `txHash`
  - `uids[]`

## Adapter Input Requirements

`primaryWallet` must expose:

- `getWalletClient()`
- `switchNetwork(chainId)` (or wallet client chain switching support)
- wallet client contract write capability (`writeContract`)
