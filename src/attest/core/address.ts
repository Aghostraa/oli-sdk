import { keccak_256 } from 'js-sha3';

function isHexAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidEvmAddress(address: string): boolean {
  if (!isHexAddress(address)) {
    return false;
  }

  const value = address.slice(2);
  const lower = value.toLowerCase();

  if (value === lower || value === value.toUpperCase()) {
    return true;
  }

  const hash = keccak_256(lower);

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (!/[a-fA-F]/.test(char)) {
      continue;
    }

    const shouldUppercase = Number.parseInt(hash[i], 16) >= 8;
    const isUppercase = char === char.toUpperCase();

    if (shouldUppercase !== isUppercase) {
      return false;
    }
  }

  return true;
}

export function toChecksumAddress(address: string): string {
  if (!isHexAddress(address)) {
    throw new Error('Invalid EVM address');
  }

  const lower = address.slice(2).toLowerCase();
  const hash = keccak_256(lower);

  let result = '0x';
  for (let i = 0; i < lower.length; i += 1) {
    const char = lower[i];
    if (!/[a-f]/.test(char)) {
      result += char;
      continue;
    }

    result += Number.parseInt(hash[i], 16) >= 8 ? char.toUpperCase() : char;
  }

  if (!isValidEvmAddress(result)) {
    throw new Error('Invalid EVM checksum address');
  }

  return result;
}
