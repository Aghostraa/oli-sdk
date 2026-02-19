import type { AttestClient } from '../api';
import type { FormFieldDefinition } from '../core/formFields';
import type {
  AttestationDiagnostic,
  AttestationFieldValue,
  AttestationModeProfileName,
  AttestationRowInput,
  BulkOnchainSubmitResult,
  BulkValidationResult,
  CsvParseResult,
  OnchainSubmitResult,
  OnchainWalletAdapter,
  ParseCsvOptions,
  PrepareSingleOptions,
  PreparedAttestation,
  SingleValidationResult,
  ValidationOptions
} from '../types';

export interface SingleAttestUIOptions {
  mode?: AttestationModeProfileName;
  initialRow?: AttestationRowInput;
  walletAdapter?: OnchainWalletAdapter;
  includeFields?: string[];
  excludeFields?: string[];
  validationOptions?: Omit<ValidationOptions, 'mode'>;
  prepareOptions?: Omit<PrepareSingleOptions, 'mode'>;
  onValidated?: (result: SingleValidationResult) => void;
  onSubmitted?: (result: OnchainSubmitResult) => void;
}

export interface BulkCsvAttestUIOptions {
  mode?: AttestationModeProfileName;
  initialRows?: AttestationRowInput[];
  initialColumns?: string[];
  walletAdapter?: OnchainWalletAdapter;
  includeFields?: string[];
  excludeFields?: string[];
  parseOptions?: Omit<ParseCsvOptions, 'mode'>;
  validationOptions?: Omit<ValidationOptions, 'mode'>;
  onParsed?: (result: CsvParseResult) => void;
  onValidated?: (result: BulkValidationResult) => void;
  onSubmitted?: (result: BulkOnchainSubmitResult) => void;
}

export interface SingleAttestUIController {
  mode: AttestationModeProfileName;
  row: AttestationRowInput;
  fields: FormFieldDefinition[];
  diagnostics: {
    errors: AttestationDiagnostic[];
    warnings: AttestationDiagnostic[];
    conversions: AttestationDiagnostic[];
    suggestions: AttestationDiagnostic[];
  };
  validation: {
    loading: boolean;
    error: Error | null;
    result: SingleValidationResult | null;
  };
  submission: {
    loading: boolean;
    error: Error | null;
    result: OnchainSubmitResult | null;
  };
  setMode: (mode: AttestationModeProfileName) => void;
  setRow: (row: AttestationRowInput) => void;
  setField: (field: string, value: AttestationFieldValue) => void;
  applySuggestion: (field: string, suggestion: string) => void;
  applyDiagnosticSuggestion: (diagnostic: AttestationDiagnostic, fallbackSuggestion?: string) => void;
  validate: (options?: Omit<ValidationOptions, 'mode'>) => Promise<SingleValidationResult>;
  prepare: (options?: Omit<PrepareSingleOptions, 'mode'>) => Promise<PreparedAttestation>;
  submit: (walletAdapter?: OnchainWalletAdapter, options?: Omit<PrepareSingleOptions, 'mode'>) => Promise<OnchainSubmitResult>;
  reset: (nextRow?: AttestationRowInput) => void;
}

export interface BulkCsvAttestUIController {
  mode: AttestationModeProfileName;
  rows: AttestationRowInput[];
  columns: string[];
  diagnostics: {
    errors: AttestationDiagnostic[];
    warnings: AttestationDiagnostic[];
    conversions: AttestationDiagnostic[];
    suggestions: AttestationDiagnostic[];
  };
  csv: {
    loading: boolean;
    error: Error | null;
    result: CsvParseResult | null;
  };
  validation: {
    loading: boolean;
    error: Error | null;
    result: BulkValidationResult | null;
  };
  submission: {
    loading: boolean;
    error: Error | null;
    result: BulkOnchainSubmitResult | null;
  };
  setMode: (mode: AttestationModeProfileName) => void;
  setRows: (rows: AttestationRowInput[]) => void;
  setColumns: (columns: string[]) => void;
  setCell: (rowIndex: number, field: string, value: AttestationFieldValue) => void;
  addRow: (row?: AttestationRowInput) => void;
  removeRow: (rowIndex: number) => void;
  parseCsvText: (csvText: string, options?: Omit<ParseCsvOptions, 'mode'>) => Promise<CsvParseResult>;
  validate: (options?: Omit<ValidationOptions, 'mode'>) => Promise<BulkValidationResult>;
  applySuggestion: (rowIndex: number, field: string, suggestion: string) => void;
  applyDiagnosticSuggestion: (diagnostic: AttestationDiagnostic, fallbackSuggestion?: string) => void;
  submit: (params?: {
    walletAdapter?: OnchainWalletAdapter;
    rows?: AttestationRowInput[] | PreparedAttestation[];
    validateBeforeSubmit?: boolean;
    validationOptions?: Omit<ValidationOptions, 'mode'>;
  }) => Promise<BulkOnchainSubmitResult>;
  reset: (nextRows?: AttestationRowInput[]) => void;
}

export interface SingleAttestModuleProps extends SingleAttestUIOptions {
  attest: AttestClient;
  children: (controller: SingleAttestUIController) => unknown;
}

export interface BulkCsvAttestModuleProps extends BulkCsvAttestUIOptions {
  attest: AttestClient;
  children: (controller: BulkCsvAttestUIController) => unknown;
}

export interface SingleAttestFormClassNames {
  root?: string;
  modeRow?: string;
  modeSelect?: string;
  fieldRow?: string;
  label?: string;
  input?: string;
  fieldError?: string;
  suggestionRow?: string;
  suggestionButton?: string;
  actionsRow?: string;
  validateButton?: string;
  submitButton?: string;
  status?: string;
}

export interface SingleAttestFormLabels {
  mode?: string;
  simpleMode?: string;
  advancedMode?: string;
  validate?: string;
  submit?: string;
  validationLoading?: string;
  submitLoading?: string;
}

export interface SingleAttestFieldRenderContext {
  field: FormFieldDefinition;
  row: AttestationRowInput;
  value: string;
  error?: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onApplySuggestion: (suggestion: string) => void;
}

export interface SingleAttestFormProps {
  controller: SingleAttestUIController;
  classNames?: SingleAttestFormClassNames;
  labels?: SingleAttestFormLabels;
  walletAdapter?: OnchainWalletAdapter;
  renderField?: (context: SingleAttestFieldRenderContext) => unknown;
}

export interface BulkCsvTableClassNames {
  root?: string;
  importRow?: string;
  csvInput?: string;
  parseButton?: string;
  tableWrapper?: string;
  table?: string;
  headerCell?: string;
  rowCell?: string;
  input?: string;
  cellError?: string;
  cellSuggestions?: string;
  suggestionButton?: string;
  actionsRow?: string;
  addRowButton?: string;
  validateButton?: string;
  submitButton?: string;
  status?: string;
}

export interface BulkCsvTableLabels {
  csvPlaceholder?: string;
  parseCsv?: string;
  addRow?: string;
  removeRow?: string;
  validate?: string;
  submit?: string;
  validationLoading?: string;
  submitLoading?: string;
}

export interface BulkCsvCellRenderContext {
  rowIndex: number;
  field: string;
  value: string;
  error?: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onApplySuggestion: (suggestion: string) => void;
}

export interface BulkCsvTableProps {
  controller: BulkCsvAttestUIController;
  classNames?: BulkCsvTableClassNames;
  labels?: BulkCsvTableLabels;
  walletAdapter?: OnchainWalletAdapter;
  renderCell?: (context: BulkCsvCellRenderContext) => unknown;
}
