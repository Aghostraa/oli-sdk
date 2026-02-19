import { useCallback, useMemo, useState } from 'react';
import type { AttestClient } from '../api';
import { FORM_FIELDS } from '../core/formFields';
import { parseCaip10 } from '../core/caip';
import type {
  AttestationDiagnostic,
  AttestationDiagnostics,
  AttestationFieldValue,
  AttestationModeProfileName,
  AttestationRowInput,
  OnchainWalletAdapter,
  PreparedAttestation,
  ValidationOptions
} from '../types';
import { AttestValidationError } from '../types';
import { useBulkCsvAttest, useSingleAttest } from './hooks';
import type {
  BulkCsvAttestModuleProps,
  BulkCsvAttestUIController,
  BulkCsvAttestUIOptions,
  SingleAttestModuleProps,
  SingleAttestUIController,
  SingleAttestUIOptions
} from './uiTypes';

const EMPTY_DIAGNOSTICS: AttestationDiagnostics = {
  errors: [],
  warnings: [],
  conversions: [],
  suggestions: []
};

interface DiagnosticsSnapshot {
  rows: AttestationRowInput[];
  diagnostics: AttestationDiagnostics;
}

function cloneRow(row: AttestationRowInput | undefined): AttestationRowInput {
  return row ? { ...row } : {};
}

function cloneRows(rows: AttestationRowInput[] | undefined): AttestationRowInput[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => ({ ...row }));
}

function cloneDiagnostics(diagnostics: AttestationDiagnostics): AttestationDiagnostics {
  return {
    errors: diagnostics.errors.map((entry) => ({ ...entry })),
    warnings: diagnostics.warnings.map((entry) => ({ ...entry })),
    conversions: diagnostics.conversions.map((entry) => ({ ...entry })),
    suggestions: diagnostics.suggestions.map((entry) => ({ ...entry }))
  };
}

function makeEmptyDiagnostics(): AttestationDiagnostics {
  return {
    errors: [],
    warnings: [],
    conversions: [],
    suggestions: []
  };
}

function serializeFieldValue(value: AttestationFieldValue): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => serializeFieldValue(entry)).join(',')}]`;
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (value === null) {
    return 'null';
  }

  return `${typeof value}:${String(value)}`;
}

function getRowSignature(row: AttestationRowInput): string {
  return Object.keys(row)
    .sort()
    .map((field) => `${field}=${serializeFieldValue(row[field])}`)
    .join('|');
}

function buildRowIndexMap(previousRows: AttestationRowInput[], nextRows: AttestationRowInput[]): Map<number, number> {
  const previousSignatures = previousRows.map((row) => getRowSignature(row));
  const nextSignatures = nextRows.map((row) => getRowSignature(row));
  const indexMap = new Map<number, number>();

  const usedPrevious = new Set<number>();
  const usedNext = new Set<number>();

  const overlapLength = Math.min(previousSignatures.length, nextSignatures.length);
  for (let i = 0; i < overlapLength; i += 1) {
    if (previousSignatures[i] === nextSignatures[i]) {
      indexMap.set(i, i);
      usedPrevious.add(i);
      usedNext.add(i);
    }
  }

  const availablePreviousBySignature = new Map<string, number[]>();
  previousSignatures.forEach((signature, index) => {
    if (usedPrevious.has(index)) {
      return;
    }

    const bucket = availablePreviousBySignature.get(signature);
    if (bucket) {
      bucket.push(index);
    } else {
      availablePreviousBySignature.set(signature, [index]);
    }
  });

  nextSignatures.forEach((signature, nextIndex) => {
    if (usedNext.has(nextIndex)) {
      return;
    }

    const bucket = availablePreviousBySignature.get(signature);
    if (!bucket || bucket.length === 0) {
      return;
    }

    const previousIndex = bucket.shift();
    if (typeof previousIndex !== 'number') {
      return;
    }

    indexMap.set(previousIndex, nextIndex);
    usedPrevious.add(previousIndex);
    usedNext.add(nextIndex);
  });

  return indexMap;
}

function remapDiagnosticsByRows(snapshot: DiagnosticsSnapshot | null, rows: AttestationRowInput[]): AttestationDiagnostics {
  if (!snapshot) {
    return EMPTY_DIAGNOSTICS;
  }

  const remapped = makeEmptyDiagnostics();
  const indexMap = buildRowIndexMap(snapshot.rows, rows);

  const remapList = (list: AttestationDiagnostic[]): AttestationDiagnostic[] => {
    const result: AttestationDiagnostic[] = [];

    list.forEach((diagnostic) => {
      if (typeof diagnostic.row !== 'number') {
        result.push({ ...diagnostic });
        return;
      }

      const nextRowIndex = indexMap.get(diagnostic.row);
      if (typeof nextRowIndex !== 'number') {
        return;
      }

      result.push({
        ...diagnostic,
        row: nextRowIndex
      });
    });

    return result;
  };

  remapped.errors = remapList(snapshot.diagnostics.errors);
  remapped.warnings = remapList(snapshot.diagnostics.warnings);
  remapped.conversions = remapList(snapshot.diagnostics.conversions);
  remapped.suggestions = remapList(snapshot.diagnostics.suggestions);

  return remapped;
}

function filterDiagnostics(
  diagnostics: AttestationDiagnostics,
  matcher: (diagnostic: AttestationDiagnostic) => boolean
): AttestationDiagnostics {
  return {
    errors: diagnostics.errors.filter(matcher),
    warnings: diagnostics.warnings.filter(matcher),
    conversions: diagnostics.conversions.filter(matcher),
    suggestions: diagnostics.suggestions.filter(matcher)
  };
}

function normalizeFieldFilters(includeFields: string[] | undefined, excludeFields: string[] | undefined) {
  const include = Array.isArray(includeFields) ? new Set(includeFields) : null;
  const exclude = Array.isArray(excludeFields) ? new Set(excludeFields) : null;
  return { include, exclude };
}

function getVisibleFields(mode: AttestationModeProfileName, includeFields?: string[], excludeFields?: string[]) {
  const { include, exclude } = normalizeFieldFilters(includeFields, excludeFields);

  return FORM_FIELDS.filter((field) => {
    if (mode === 'simpleProfile' && field.visibility === 'advanced') {
      return false;
    }

    if (include && !include.has(field.id)) {
      return false;
    }

    if (exclude && exclude.has(field.id)) {
      return false;
    }

    return true;
  });
}

function isPreparedAttestationRow(row: unknown): row is PreparedAttestation {
  if (!row || typeof row !== 'object') {
    return false;
  }

  const candidate = row as PreparedAttestation;
  return (
    typeof candidate.encodedData === 'string' &&
    typeof candidate.request === 'object' &&
    typeof candidate.network === 'object' &&
    typeof candidate.network?.chainId === 'number'
  );
}

function isPreparedRows(rows: AttestationRowInput[] | PreparedAttestation[]): rows is PreparedAttestation[] {
  if (rows.length === 0) {
    return false;
  }
  return isPreparedAttestationRow(rows[0]);
}

function parseAddressInput(row: AttestationRowInput, value: AttestationFieldValue): AttestationRowInput {
  if (typeof value !== 'string') {
    return row;
  }

  const parsedCaip10 = parseCaip10(value);
  if (!parsedCaip10) {
    return row;
  }

  const next: AttestationRowInput = {
    ...row,
    address: parsedCaip10.address
  };

  if (parsedCaip10.isKnownChain) {
    next.chain_id = parsedCaip10.chainId;
  }

  return next;
}

function hasOwnWalletAdapter(walletAdapter?: OnchainWalletAdapter): walletAdapter is OnchainWalletAdapter {
  return !!walletAdapter;
}

export function useSingleAttestUI(attest: AttestClient, options: SingleAttestUIOptions = {}): SingleAttestUIController {
  const [mode, setMode] = useState<AttestationModeProfileName>(options.mode ?? 'simpleProfile');
  const [row, setRow] = useState<AttestationRowInput>(() => cloneRow(options.initialRow));
  const single = useSingleAttest(attest);

  const fields = useMemo(
    () => getVisibleFields(mode, options.includeFields, options.excludeFields),
    [mode, options.includeFields, options.excludeFields]
  );

  const diagnostics = single.validation.result?.diagnostics ?? EMPTY_DIAGNOSTICS;

  const setField = useCallback((field: string, value: AttestationFieldValue) => {
    setRow((current) => {
      const next: AttestationRowInput = {
        ...current,
        [field]: value
      };

      if (field === 'address') {
        return parseAddressInput(next, value);
      }

      return next;
    });
  }, []);

  const applySuggestion = useCallback(
    (field: string, suggestion: string) => {
      setRow((current) => attest.applySuggestion(current, field, suggestion));
    },
    [attest]
  );

  const applyDiagnosticSuggestion = useCallback(
    (diagnostic: AttestationDiagnostic, fallbackSuggestion = '') => {
      if (!diagnostic.field) {
        return;
      }

      const suggestion = diagnostic.suggestion ?? diagnostic.suggestions?.[0] ?? fallbackSuggestion;
      if (!suggestion) {
        return;
      }

      applySuggestion(diagnostic.field, suggestion);
    },
    [applySuggestion]
  );

  const validate = useCallback(
    async (overrideOptions: Omit<ValidationOptions, 'mode'> = {}) => {
      const result = await single.validate(row, {
        ...options.validationOptions,
        ...overrideOptions,
        mode
      });
      setRow(result.row);
      options.onValidated?.(result);
      return result;
    },
    [single, row, options.validationOptions, options.onValidated, mode]
  );

  const prepare = useCallback(
    async (overrideOptions: Omit<import('../types').PrepareSingleOptions, 'mode'> = {}) => {
      return attest.prepareSingleAttestation(row, {
        ...options.prepareOptions,
        ...overrideOptions,
        mode
      });
    },
    [attest, row, options.prepareOptions, mode]
  );

  const submit = useCallback(
    async (
      walletAdapter?: OnchainWalletAdapter,
      overrideOptions: Omit<import('../types').PrepareSingleOptions, 'mode'> = {}
    ) => {
      const activeWalletAdapter = walletAdapter ?? options.walletAdapter;
      if (!hasOwnWalletAdapter(activeWalletAdapter)) {
        throw new Error('Single attestation submit requires a wallet adapter.');
      }

      const prepared = await prepare(overrideOptions);
      const result = await single.submitPrepared(prepared, activeWalletAdapter);
      options.onSubmitted?.(result);
      return result;
    },
    [options.walletAdapter, options.onSubmitted, prepare, single]
  );

  const reset = useCallback(
    (nextRow?: AttestationRowInput) => {
      setRow(cloneRow(nextRow ?? options.initialRow));
    },
    [options.initialRow]
  );

  return useMemo(
    () => ({
      mode,
      row,
      fields,
      diagnostics,
      validation: single.validation,
      submission: single.submission,
      setMode,
      setRow,
      setField,
      applySuggestion,
      applyDiagnosticSuggestion,
      validate,
      prepare,
      submit,
      reset
    }),
    [
      mode,
      row,
      fields,
      diagnostics,
      single.validation,
      single.submission,
      setField,
      applySuggestion,
      applyDiagnosticSuggestion,
      validate,
      prepare,
      submit,
      reset
    ]
  );
}

export function useBulkCsvAttestUI(attest: AttestClient, options: BulkCsvAttestUIOptions = {}): BulkCsvAttestUIController {
  const [mode, setMode] = useState<AttestationModeProfileName>(options.mode ?? 'advancedProfile');
  const [rowsState, setRowsState] = useState<AttestationRowInput[]>(() => cloneRows(options.initialRows));
  const [columns, setColumns] = useState<string[]>(() => {
    if (Array.isArray(options.initialColumns) && options.initialColumns.length > 0) {
      return [...options.initialColumns];
    }

    return getVisibleFields(mode, options.includeFields, options.excludeFields).map((field) => field.id);
  });
  const [diagnosticsSnapshot, setDiagnosticsSnapshot] = useState<DiagnosticsSnapshot | null>(null);

  const bulk = useBulkCsvAttest(attest);
  const rows = rowsState.length > 0 ? rowsState : [{}];
  const diagnostics = useMemo(() => remapDiagnosticsByRows(diagnosticsSnapshot, rows), [diagnosticsSnapshot, rows]);

  const setRows = useCallback((nextRows: AttestationRowInput[]) => {
    const cloned = cloneRows(nextRows);
    setRowsState(cloned.length > 0 ? cloned : [{}]);
  }, []);

  const setCell = useCallback((rowIndex: number, field: string, value: AttestationFieldValue) => {
    setRowsState((currentRows) => {
      if (rowIndex < 0 || rowIndex >= currentRows.length) {
        return currentRows;
      }

      return currentRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const next: AttestationRowInput = {
          ...row,
          [field]: value
        };

        if (field === 'address') {
          return parseAddressInput(next, value);
        }

        return next;
      });
    });
  }, []);

  const addRow = useCallback((nextRow: AttestationRowInput = {}) => {
    setRowsState((currentRows) => {
      if (currentRows.length >= 50) {
        return currentRows;
      }
      return [...currentRows, cloneRow(nextRow)];
    });
  }, []);

  const removeRow = useCallback((rowIndex: number) => {
    setRowsState((currentRows) => {
      if (currentRows.length <= 1) {
        return [{}];
      }

      return currentRows.filter((_, index) => index !== rowIndex);
    });
  }, []);

  const parseCsvText = useCallback(
    async (csvText: string, overrideOptions: Omit<import('../types').ParseCsvOptions, 'mode'> = {}) => {
      const result = await bulk.parseCsv(csvText, {
        ...options.parseOptions,
        ...overrideOptions,
        mode
      });

      setRows(cloneRows(result.rows));
      setDiagnosticsSnapshot({
        rows: cloneRows(result.rows),
        diagnostics: cloneDiagnostics(result.diagnostics)
      });
      if (result.columns.length > 0) {
        setColumns([...result.columns]);
      }

      options.onParsed?.(result);
      return result;
    },
    [bulk, options.parseOptions, options.onParsed, mode]
  );

  const validate = useCallback(
    async (overrideOptions: Omit<ValidationOptions, 'mode'> = {}) => {
      const result = await bulk.validate(rows, {
        maxRows: 50,
        ...options.validationOptions,
        ...overrideOptions,
        mode
      });

      setRows(cloneRows(result.rows));
      setDiagnosticsSnapshot({
        rows: cloneRows(result.rows),
        diagnostics: cloneDiagnostics(result.diagnostics)
      });
      options.onValidated?.(result);
      return result;
    },
    [bulk, rows, options.validationOptions, options.onValidated, mode]
  );

  const applySuggestion = useCallback(
    (rowIndex: number, field: string, suggestion: string) => {
      setRowsState((currentRows) => {
        if (rowIndex < 0 || rowIndex >= currentRows.length) {
          return currentRows;
        }

        return currentRows.map((row, index) => {
          if (index !== rowIndex) {
            return row;
          }

          return attest.applySuggestion(row, field, suggestion);
        });
      });
    },
    [attest]
  );

  const applyDiagnosticSuggestion = useCallback(
    (diagnostic: AttestationDiagnostic, fallbackSuggestion = '') => {
      const rowIndex = typeof diagnostic.row === 'number' ? diagnostic.row : 0;
      const field = diagnostic.field;
      const suggestion = diagnostic.suggestion ?? diagnostic.suggestions?.[0] ?? fallbackSuggestion;

      if (typeof field !== 'string' || !suggestion) {
        return;
      }

      applySuggestion(rowIndex, field, suggestion);
    },
    [applySuggestion]
  );

  const getRowDiagnostics = useCallback(
    (rowIndex: number): AttestationDiagnostics =>
      filterDiagnostics(diagnostics, (diagnostic) => diagnostic.row === rowIndex),
    [diagnostics]
  );

  const getFieldDiagnostics = useCallback(
    (rowIndex: number, field: string): AttestationDiagnostics =>
      filterDiagnostics(diagnostics, (diagnostic) => diagnostic.row === rowIndex && diagnostic.field === field),
    [diagnostics]
  );

  const getFieldError = useCallback(
    (rowIndex: number, field: string): AttestationDiagnostic | undefined => {
      return getFieldDiagnostics(rowIndex, field).errors[0];
    },
    [getFieldDiagnostics]
  );

  const submit = useCallback(
    async (params: {
      walletAdapter?: OnchainWalletAdapter;
      rows?: AttestationRowInput[] | PreparedAttestation[];
      validateBeforeSubmit?: boolean;
      validationOptions?: Omit<ValidationOptions, 'mode'>;
    } = {}) => {
      const activeWalletAdapter = params.walletAdapter ?? options.walletAdapter;
      if (!hasOwnWalletAdapter(activeWalletAdapter)) {
        throw new Error('Bulk submit requires a wallet adapter.');
      }

      const validateBeforeSubmit = params.validateBeforeSubmit !== false;
      let submitRows: AttestationRowInput[] | PreparedAttestation[] =
        Array.isArray(params.rows) && params.rows.length > 0 ? params.rows : rows;

      if (!Array.isArray(submitRows) || submitRows.length === 0) {
        throw new Error('Bulk submit requires at least one row.');
      }

      if (validateBeforeSubmit && !isPreparedRows(submitRows)) {
        const validation = await validate(params.validationOptions);
        if (!validation.valid) {
          throw new AttestValidationError('Bulk attestation rows failed validation.', validation.diagnostics);
        }
        submitRows = validation.validRows;
      }

      const result = await bulk.submit(submitRows, activeWalletAdapter);
      options.onSubmitted?.(result);
      return result;
    },
    [options.walletAdapter, options.onSubmitted, rows, bulk, validate]
  );

  const reset = useCallback(
    (nextRows?: AttestationRowInput[]) => {
      const resolvedRows = cloneRows(nextRows ?? options.initialRows);
      setRowsState(resolvedRows.length > 0 ? resolvedRows : [{}]);
      setDiagnosticsSnapshot(null);

      if (Array.isArray(options.initialColumns) && options.initialColumns.length > 0) {
        setColumns([...options.initialColumns]);
      } else {
        setColumns(getVisibleFields(mode, options.includeFields, options.excludeFields).map((field) => field.id));
      }
    },
    [options.initialRows, options.initialColumns, options.includeFields, options.excludeFields, mode]
  );

  return useMemo(
    () => ({
      mode,
      rows,
      columns,
      diagnostics,
      csv: bulk.csv,
      validation: bulk.validation,
      submission: bulk.submission,
      setMode,
      setRows,
      setColumns,
      setCell,
      addRow,
      removeRow,
      parseCsvText,
      validate,
      getRowDiagnostics,
      getFieldDiagnostics,
      getFieldError,
      applySuggestion,
      applyDiagnosticSuggestion,
      submit,
      reset
    }),
    [
      mode,
      rows,
      columns,
      diagnostics,
      bulk.csv,
      bulk.validation,
      bulk.submission,
      setCell,
      addRow,
      removeRow,
      parseCsvText,
      validate,
      getRowDiagnostics,
      getFieldDiagnostics,
      getFieldError,
      applySuggestion,
      applyDiagnosticSuggestion,
      submit,
      reset
    ]
  );
}

export function SingleAttestModule(props: SingleAttestModuleProps): unknown {
  const { attest, children, ...options } = props;
  const controller = useSingleAttestUI(attest, options);
  return children(controller);
}

export function BulkCsvAttestModule(props: BulkCsvAttestModuleProps): unknown {
  const { attest, children, ...options } = props;
  const controller = useBulkCsvAttestUI(attest, options);
  return children(controller);
}
