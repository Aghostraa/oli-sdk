# Attest UI Components (`@openlabels/oli-sdk/attest-ui`)

This module provides configurable React UI building blocks for frontend-like attestation flows while keeping styling fully host-controlled.

## Exports

- Hooks/controllers
  - `useSingleAttestUI(attestClient, options)`
  - `useBulkCsvAttestUI(attestClient, options)`
- Render-prop modules
  - `SingleAttestModule`
  - `BulkCsvAttestModule`
- Unstyled default primitives
  - `SingleAttestForm`
  - `BulkCsvTable`

## Single Attest (Headless)

```ts
import { useSingleAttestUI } from '@openlabels/oli-sdk/attest-ui';

const controller = useSingleAttestUI(oli.attest, {
  mode: 'simpleProfile',
  walletAdapter,
  includeFields: ['chain_id', 'address', 'contract_name', 'owner_project', 'usage_category'],
  onSubmitted: (result) => {
    console.log(result.status, result.txHash, result.uids);
  }
});

await controller.validate();
await controller.submit();
```

## Single Attest (Configurable Primitive)

```ts
import { SingleAttestForm, useSingleAttestUI } from '@openlabels/oli-sdk/attest-ui';

const controller = useSingleAttestUI(oli.attest, { walletAdapter });

return (
  <SingleAttestForm
    controller={controller}
    classNames={{
      root: 'my-form',
      fieldRow: 'my-row',
      input: 'my-input',
      suggestionButton: 'my-suggestion-chip'
    }}
    renderField={({ field, value, onChange, error }) => (
      <div>
        <label>{field.label}</label>
        <input value={value} onChange={(e) => onChange(e.target.value)} />
        {error ? <small>{error}</small> : null}
      </div>
    )}
  />
);
```

## Bulk CSV (Controller + Table)

```ts
import { useBulkCsvAttestUI, BulkCsvTable } from '@openlabels/oli-sdk/attest-ui';

const controller = useBulkCsvAttestUI(oli.attest, {
  mode: 'advancedProfile',
  walletAdapter,
  includeFields: ['chain_id', 'address', 'contract_name', 'owner_project', 'usage_category', 'paymaster_category']
});

return (
  <BulkCsvTable
    controller={controller}
    classNames={{
      table: 'my-table',
      input: 'my-cell-input',
      cellError: 'my-error'
    }}
    renderCell={({ value, onChange, suggestions, onApplySuggestion }) => (
      <div>
        <input value={value} onChange={(e) => onChange(e.target.value)} />
        {suggestions.map((item) => (
          <button key={item} type="button" onClick={() => onApplySuggestion(item)}>{item}</button>
        ))}
      </div>
    )}
  />
);
```

## Guardrails and Behavior

- Enforces frontend parity write constraints through `oli.attest` APIs.
- Bulk row submit path defaults to `maxRows: 50` validation.
- CAIP-10 address input normalization is applied in controllers.
- Suggestion application uses the same `applySuggestion` behavior as `oli.attest`.
