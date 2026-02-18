import { CHAINS } from '../core/chains';
import { VALID_CATEGORY_IDS } from '../core/categories';

const VALID_PAYMASTER_CATEGORIES = ['verifying', 'token', 'verifying_and_token'];

export function isValidEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function validateAddress(address: unknown): string {
  if (!address) return 'Address is required';
  if (typeof address !== 'string' || !isValidEvmAddress(address)) {
    return 'Invalid EVM address';
  }
  return '';
}

function isEvmChainId(chainId?: string): boolean {
  return typeof chainId === 'string' && chainId.toLowerCase().startsWith('eip155:');
}

export function validateAddressForChain(address: unknown, chainId?: string): string {
  if (!address) return 'Address is required';
  if (!chainId || !isEvmChainId(chainId)) {
    return '';
  }
  return validateAddress(address);
}

export function validateContractName(name: unknown): string {
  if (typeof name === 'string' && name.length > 40) {
    return 'Contract name must be 40 characters or less';
  }
  return '';
}

export function validateTxHash(txHash: unknown): string {
  if (!txHash) return '';
  const hash = String(txHash);
  return /^0x[a-fA-F0-9]{64}$/.test(hash) ? '' : 'Invalid transaction hash format';
}

export function validateURL(url: unknown): string {
  if (!url) return '';
  const value = String(url);
  if (!value.startsWith('https://') && !value.startsWith('www.')) {
    return 'URL must start with https:// or www.';
  }

  try {
    const normalized = value.startsWith('www.') ? `https://${value}` : value;
    new URL(normalized);
    return '';
  } catch {
    return 'Invalid URL format';
  }
}

export function validateBoolean(value: unknown): string | null {
  const normalized = String(value ?? '');
  return normalized === '' || normalized === 'true' || normalized === 'false' ? null : 'Must be true or false';
}

export function validateChain(value: string): string | null {
  if (!value || !value.trim()) {
    return 'Chain is required';
  }

  const isValid = CHAINS.some((chain) => chain.caip2 === value);
  if (!isValid) {
    return `Invalid chain: "${value}". Must be a valid CAIP-2 chain identifier.`;
  }

  return null;
}

export function validateCategory(value: string): string | null {
  if (!value) return null;
  return VALID_CATEGORY_IDS.includes(value)
    ? null
    : `Invalid category: "${value}". Please select from available categories.`;
}

export function validatePaymasterCategory(value: string): string | null {
  if (!value) return null;
  return VALID_PAYMASTER_CATEGORIES.includes(value)
    ? null
    : `Invalid paymaster category: "${value}". Please select from available categories (verifying, token, verifying_and_token).`;
}
