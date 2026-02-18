import type {
  OnchainAttestationRequest,
  OnchainSubmitContext,
  OnchainTxResult,
  OnchainWalletAdapter
} from '../types';
import { BASE_CHAIN_IDS, DEFAULT_COINBASE_PAYMASTER_URL, isSupportedAttestationNetwork } from '../core/eas';
import { EAS_ATTEST_ABI } from './easAbi';
import { extractUidsFromReceipt, normalizeReceiptStatus, waitForTransactionReceipt } from './utils';

export interface DynamicWalletClientLike {
  chain?: { id?: number };
  getChainId?: () => Promise<number>;
  writeContract?: (params: Record<string, unknown>) => Promise<string>;
  request?: (payload: { method: string; params?: unknown[] }) => Promise<unknown>;
  transport?: {
    request?: (payload: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
  switchChain?: (params: { id: number }) => Promise<void>;
}

export interface DynamicPrimaryWalletLike {
  address?: string;
  connector?: { name?: string | null };
  switchNetwork?: (chainId: number) => Promise<void>;
  getWalletClient: () => Promise<DynamicWalletClientLike>;
}

class DynamicWalletAdapter implements OnchainWalletAdapter {
  public readonly name = 'dynamic-wallet-adapter';

  constructor(
    private readonly primaryWallet: DynamicPrimaryWalletLike,
    private readonly options: {
      paymasterUrl?: string;
    } = {}
  ) {}

  private async getWalletClient(): Promise<DynamicWalletClientLike> {
    const client = await this.primaryWallet.getWalletClient();
    if (!client) {
      throw new Error('Dynamic wallet client is unavailable.');
    }
    return client;
  }

  private async rpcRequest(client: DynamicWalletClientLike, method: string, params: unknown[] = []): Promise<unknown> {
    if (typeof client.request === 'function') {
      return client.request({ method, params });
    }

    if (client.transport && typeof client.transport.request === 'function') {
      return client.transport.request({ method, params });
    }

    throw new Error('Dynamic wallet client does not expose an RPC request interface.');
  }

  async getChainId(): Promise<number> {
    const client = await this.getWalletClient();

    if (typeof client.getChainId === 'function') {
      return client.getChainId();
    }

    if (client.chain?.id) {
      return client.chain.id;
    }

    const chainIdHex = await this.rpcRequest(client, 'eth_chainId');
    if (typeof chainIdHex !== 'string') {
      throw new Error('Unable to determine wallet chain ID.');
    }

    return Number.parseInt(chainIdHex, 16);
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!isSupportedAttestationNetwork(chainId)) {
      throw new Error(`Unsupported attestation network: ${chainId}`);
    }

    if (typeof this.primaryWallet.switchNetwork === 'function') {
      await this.primaryWallet.switchNetwork(chainId);
      return;
    }

    const client = await this.getWalletClient();
    if (typeof client.switchChain === 'function') {
      await client.switchChain({ id: chainId });
      return;
    }

    throw new Error('Dynamic wallet cannot switch networks programmatically.');
  }

  async isSponsorshipSupported(chainId: number): Promise<boolean> {
    const walletName = this.primaryWallet.connector?.name?.toLowerCase() ?? '';
    const isCoinbase =
      walletName === 'coinbase' ||
      walletName === 'coinbase smart wallet' ||
      walletName === 'coinbase_smart_wallet';

    return isCoinbase && BASE_CHAIN_IDS.includes(chainId as (typeof BASE_CHAIN_IDS)[number]);
  }

  private async executeWrite(
    requestParams: {
      functionName: 'attest' | 'multiAttest';
      args: unknown[];
    },
    context: OnchainSubmitContext,
    sponsored: boolean
  ): Promise<OnchainTxResult> {
    const client = await this.getWalletClient();

    if (typeof client.writeContract !== 'function') {
      throw new Error('Dynamic wallet client does not support contract writes.');
    }

    const writeParams: Record<string, unknown> = {
      address: context.network.easContractAddress,
      abi: EAS_ATTEST_ABI,
      functionName: requestParams.functionName,
      args: requestParams.args,
      value: BigInt(0)
    };

    if (sponsored) {
      writeParams.capabilities = {
        paymasterService: {
          url: context.paymasterUrl ?? this.options.paymasterUrl ?? DEFAULT_COINBASE_PAYMASTER_URL
        }
      };
    }

    const txHash = await client.writeContract(writeParams);
    const receipt = await waitForTransactionReceipt(client as unknown as Record<string, unknown>, txHash);

    return {
      status: normalizeReceiptStatus(receipt),
      txHash,
      uids: extractUidsFromReceipt(receipt, context.network.easContractAddress),
      raw: receipt
    };
  }

  async attest(request: OnchainAttestationRequest, context: OnchainSubmitContext): Promise<OnchainTxResult> {
    return this.executeWrite(
      {
        functionName: 'attest',
        args: [
          {
            schema: request.schemaUID,
            data: request.data
          }
        ]
      },
      context,
      false
    );
  }

  async sponsoredAttest(request: OnchainAttestationRequest, context: OnchainSubmitContext): Promise<OnchainTxResult> {
    return this.executeWrite(
      {
        functionName: 'attest',
        args: [
          {
            schema: request.schemaUID,
            data: request.data
          }
        ]
      },
      context,
      true
    );
  }

  async multiAttest(requests: OnchainAttestationRequest[], context: OnchainSubmitContext): Promise<OnchainTxResult> {
    if (requests.length === 0) {
      throw new Error('multiAttest requires at least one request.');
    }

    const schemaUID = requests[0].schemaUID;

    return this.executeWrite(
      {
        functionName: 'multiAttest',
        args: [
          [
            {
              schema: schemaUID,
              data: requests.map((request) => request.data)
            }
          ]
        ]
      },
      context,
      false
    );
  }

  async sponsoredMultiAttest(requests: OnchainAttestationRequest[], context: OnchainSubmitContext): Promise<OnchainTxResult> {
    if (requests.length === 0) {
      throw new Error('sponsoredMultiAttest requires at least one request.');
    }

    const schemaUID = requests[0].schemaUID;

    return this.executeWrite(
      {
        functionName: 'multiAttest',
        args: [
          [
            {
              schema: schemaUID,
              data: requests.map((request) => request.data)
            }
          ]
        ]
      },
      context,
      true
    );
  }
}

export function createDynamicWalletAdapter(
  primaryWallet: DynamicPrimaryWalletLike,
  options: { paymasterUrl?: string } = {}
): OnchainWalletAdapter {
  return new DynamicWalletAdapter(primaryWallet, options);
}
