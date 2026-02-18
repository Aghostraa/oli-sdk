# Attestation Quickstart

## Drop-In (Frontend-like)

```ts
import { OLIClient, createDynamicWalletAdapter } from '@openlabels/oli-sdk';

const oli = new OLIClient();
await oli.init();

const adapter = createDynamicWalletAdapter(primaryWallet);

const parsed = await oli.attest.parseCsv(csvText);
const validation = await oli.attest.validateBulk(parsed.rows, { mode: 'simpleProfile' });

if (!validation.valid) {
  console.log(validation.diagnostics);
  return;
}

const tx = await oli.attest.submitBulkOnchain(validation.validRows, adapter);
console.log(tx.status, tx.txHash, tx.uids);
```

## Single Form Flow

```ts
const input = {
  chain_id: 'eip155:1',
  address: '0x1234567890123456789012345678901234567890',
  usage_category: 'dex',
  owner_project: 'growthepie'
};

const prepared = await oli.attest.prepareSingleAttestation(input, {
  mode: 'simpleProfile'
});

const tx = await oli.attest.submitSingleOnchain(prepared, adapter);
```

## Headless Usage Example

Use this when you do not want React hooks/UI components.

```ts
import { OLIClient } from '@openlabels/oli-sdk';

const oli = new OLIClient();
await oli.init();

const rows = [
  {
    chain_id: 'eip155:1',
    address: '0x1234567890123456789012345678901234567890',
    usage_category: 'defi'
  }
];

const validation = await oli.attest.validateBulk(rows, {
  mode: 'advancedProfile',
  projects: [
    { owner_project: 'growthepie', display_name: 'Growthepie' }
  ]
});

for (const suggestion of validation.diagnostics.suggestions) {
  if (suggestion.field && suggestion.suggestions?.length) {
    rows[suggestion.row ?? 0] = oli.attest.applySuggestion(
      rows[suggestion.row ?? 0],
      suggestion.field,
      suggestion.suggestions[0]
    );
  }
}
```
