import { getAddress } from '@ethersproject/address';

export function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

export function isAddressSimple(value: any): boolean {
  if (value.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
    return true;
    // Maybe ICAP? (we only support direct mode)
  }
  return false;
}
