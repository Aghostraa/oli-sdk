import type { AttestationDiagnostic, AttestationDiagnostics } from '../types';

interface DiagnosticPointer {
  row?: number;
  field?: string;
  suggestion?: string;
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export function createDiagnostics(): AttestationDiagnostics {
  return {
    errors: [],
    warnings: [],
    conversions: [],
    suggestions: []
  };
}

function makeDiagnostic(code: string, message: string, pointer: DiagnosticPointer = {}): AttestationDiagnostic {
  return {
    code,
    message,
    ...pointer
  };
}

export function addError(
  diagnostics: AttestationDiagnostics,
  code: string,
  message: string,
  pointer: DiagnosticPointer = {}
): AttestationDiagnostic {
  const diagnostic = makeDiagnostic(code, message, pointer);
  diagnostics.errors.push(diagnostic);
  return diagnostic;
}

export function addWarning(
  diagnostics: AttestationDiagnostics,
  code: string,
  message: string,
  pointer: DiagnosticPointer = {}
): AttestationDiagnostic {
  const diagnostic = makeDiagnostic(code, message, pointer);
  diagnostics.warnings.push(diagnostic);
  return diagnostic;
}

export function addConversion(
  diagnostics: AttestationDiagnostics,
  code: string,
  message: string,
  pointer: DiagnosticPointer = {}
): AttestationDiagnostic {
  const diagnostic = makeDiagnostic(code, message, pointer);
  diagnostics.conversions.push(diagnostic);
  return diagnostic;
}

export function addSuggestion(
  diagnostics: AttestationDiagnostics,
  code: string,
  message: string,
  pointer: DiagnosticPointer = {}
): AttestationDiagnostic {
  const diagnostic = makeDiagnostic(code, message, pointer);
  diagnostics.suggestions.push(diagnostic);
  return diagnostic;
}

export function mergeDiagnostics(target: AttestationDiagnostics, incoming: AttestationDiagnostics): AttestationDiagnostics {
  target.errors.push(...incoming.errors);
  target.warnings.push(...incoming.warnings);
  target.conversions.push(...incoming.conversions);
  target.suggestions.push(...incoming.suggestions);
  return target;
}

export function hasErrors(diagnostics: AttestationDiagnostics): boolean {
  return diagnostics.errors.length > 0;
}
