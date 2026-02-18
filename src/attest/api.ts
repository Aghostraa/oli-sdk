import type {
  AttestationRowInput,
  BulkOnchainSubmitResult,
  BulkValidationResult,
  OnchainAttestationRequest,
  OnchainWalletAdapter,
  ParseCsvOptions,
  PrepareSingleOptions,
  PreparedAttestation,
  ProjectRecord,
  SingleValidationResult,
  ValidationOptions
} from './types';
import { AttestValidationError } from './types';
import { createAttestationRequestData, prepareEncodedData, prepareTags } from './core/payload';
import {
  DEFAULT_ATTESTATION_NETWORK,
  FRONTEND_ATTESTATION_RECIPIENT,
  getAttestationNetworkConfig,
  isSupportedAttestationNetwork
} from './core/eas';
import { resolveModeProfile } from './core/profiles';
import { buildCaip10, parseCaip10 } from './core/caip';
import { parseCsv as parseCsvValidation } from './validation/csv';
import { validateBulk as validateBulkRows, validateSingle as validateSingleRow } from './validation/validate';
import { submitBulkOnchain as submitBulkTransport, submitSingleOnchain as submitSingleTransport } from './transport/submit';

export class AttestClient {
  constructor(
    private readonly options: {
      fetchProjects?: () => Promise<ProjectRecord[]>;
      defaultAttestationNetwork?: number;
      defaultRecipient?: string;
    } = {}
  ) {}

  async parseCsv(csvText: string, options: ParseCsvOptions = {}) {
    return parseCsvValidation(csvText, {
      ...options,
      fetchProjects: options.fetchProjects ?? this.options.fetchProjects
    });
  }

  async validateSingle(input: AttestationRowInput, options: ValidationOptions = {}): Promise<SingleValidationResult> {
    return validateSingleRow(input, {
      ...options,
      fetchProjects: options.fetchProjects ?? this.options.fetchProjects
    });
  }

  async validateBulk(rows: AttestationRowInput[], options: ValidationOptions = {}): Promise<BulkValidationResult> {
    return validateBulkRows(rows, {
      ...options,
      fetchProjects: options.fetchProjects ?? this.options.fetchProjects,
      maxRows: options.maxRows ?? 50
    });
  }

  applySuggestion(row: AttestationRowInput, field: string, suggestion: string): AttestationRowInput {
    const nextRow: AttestationRowInput = {
      ...row,
      [field]: suggestion
    };

    if (field === 'address') {
      const parsed = parseCaip10(suggestion);
      if (parsed) {
        nextRow.address = parsed.address;
        if (parsed.isKnownChain) {
          nextRow.chain_id = parsed.chainId;
        }
      }
    }

    return nextRow;
  }

  async prepareSingleAttestation(input: AttestationRowInput, options: PrepareSingleOptions = {}): Promise<PreparedAttestation> {
    const mode = resolveModeProfile(options.mode);
    const validation = await this.validateSingle(input, {
      mode,
      projects: options.projects,
      fetchProjects: options.fetchProjects
    });

    if (options.validate !== false && !validation.valid) {
      throw new AttestValidationError('Single attestation input failed validation.', validation.diagnostics);
    }

    const row = validation.row;
    const chainId = typeof row.chain_id === 'string' ? row.chain_id : '';
    const address = typeof row.address === 'string' ? row.address : '';

    if (!chainId || !address) {
      throw new AttestValidationError('Single attestation requires chain_id and address.', validation.diagnostics);
    }

    const networkId =
      options.attestationNetwork ??
      (typeof row.attestation_network === 'number' ? row.attestation_network : this.options.defaultAttestationNetwork) ??
      DEFAULT_ATTESTATION_NETWORK;

    if (!isSupportedAttestationNetwork(networkId)) {
      throw new Error(`Unsupported attestation network: ${networkId}`);
    }

    const network = getAttestationNetworkConfig(networkId);
    const tags = prepareTags(row);
    const caip10 = buildCaip10(chainId, address);
    const encodedData = prepareEncodedData(chainId, address, tags);
    const recipient = options.recipient ?? this.options.defaultRecipient ?? FRONTEND_ATTESTATION_RECIPIENT;

    return {
      mode: mode.id,
      network,
      recipient,
      chainId,
      address,
      caip10,
      tags,
      encodedData,
      raw: row,
      request: createAttestationRequestData(encodedData, recipient)
    };
  }

  async submitSingleOnchain(
    prepared: PreparedAttestation,
    walletAdapter: OnchainWalletAdapter
  ): Promise<import('./types').OnchainSubmitResult> {
    const request: OnchainAttestationRequest = {
      schemaUID: prepared.network.schemaUID,
      data: prepared.request,
      prepared
    };

    return submitSingleTransport(request, walletAdapter, {
      network: prepared.network
    });
  }

  async submitBulkOnchain(
    rows: AttestationRowInput[] | PreparedAttestation[],
    walletAdapter: OnchainWalletAdapter
  ): Promise<BulkOnchainSubmitResult> {
    const preparedRows = await this.normalizeBulkPreparedRows(rows);

    const requests: OnchainAttestationRequest[] = preparedRows.map((prepared) => ({
      schemaUID: prepared.network.schemaUID,
      data: prepared.request,
      prepared
    }));

    return submitBulkTransport(requests, walletAdapter, {
      network: preparedRows[0].network
    });
  }

  private async normalizeBulkPreparedRows(
    rows: AttestationRowInput[] | PreparedAttestation[]
  ): Promise<PreparedAttestation[]> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('submitBulkOnchain requires at least one row.');
    }

    const maybePrepared = rows as PreparedAttestation[];
    if (this.isPreparedAttestation(maybePrepared[0])) {
      const preparedRows = maybePrepared;
      if (preparedRows.length > 50) {
        throw new Error(`You can only submit up to 50 attestations at once. You currently have ${preparedRows.length} rows.`);
      }

      const networkId = preparedRows[0].network.chainId;
      const hasMixedNetwork = preparedRows.some((row) => row.network.chainId !== networkId);
      if (hasMixedNetwork) {
        throw new Error('submitBulkOnchain does not support mixed attestation networks in one batch.');
      }
      return preparedRows;
    }

    const rawRows = rows as AttestationRowInput[];
    const bulkValidation = await this.validateBulk(rawRows, {
      maxRows: 50
    });

    if (!bulkValidation.valid) {
      throw new AttestValidationError('Bulk attestation rows failed validation.', bulkValidation.diagnostics);
    }

    const validRows = bulkValidation.validRows.filter((row) => {
      const address = typeof row.address === 'string' ? row.address.trim() : '';
      return address !== '';
    });

    if (validRows.length === 0) {
      throw new Error('No valid rows available for onchain submission.');
    }

    if (validRows.length > 50) {
      throw new Error(`You can only submit up to 50 attestations at once. You currently have ${validRows.length} rows.`);
    }

    const networkId =
      typeof validRows[0].attestation_network === 'number'
        ? validRows[0].attestation_network
        : this.options.defaultAttestationNetwork ?? DEFAULT_ATTESTATION_NETWORK;

    const hasMixedNetwork = validRows.some((row) => {
      const candidate = typeof row.attestation_network === 'number' ? row.attestation_network : networkId;
      return candidate !== networkId;
    });

    if (hasMixedNetwork) {
      throw new Error('submitBulkOnchain does not support mixed attestation networks in one batch.');
    }

    const preparedRows: PreparedAttestation[] = [];
    for (const row of validRows) {
      preparedRows.push(
        await this.prepareSingleAttestation(row, {
          validate: false,
          mode: 'advancedProfile',
          attestationNetwork: networkId
        })
      );
    }

    return preparedRows;
  }

  private isPreparedAttestation(value: unknown): value is PreparedAttestation {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as PreparedAttestation;
    return (
      typeof candidate.encodedData === 'string' &&
      !!candidate.network &&
      typeof candidate.network.chainId === 'number' &&
      !!candidate.request
    );
  }
}
