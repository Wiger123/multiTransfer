import useActiveWeb3React from './useActiveWeb3React';
import { useMemo } from 'react';
import { getProviderOrSigner } from '../utils';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';
import { getMultiTransferAddress } from '@/utils/addressHelpers';
import bep20TransferAbi from '@/config/abi/erc20Transfer.json';
import bep20Abi from '@/config/abi/erc20.json';
import { isAddress } from '@/utils/address';

export const useERC20 = (address: string, withSignerIfPossible = true) => {
  return useContract(address, bep20Abi, withSignerIfPossible);
};

export const getERC20 = (address: string, withSignerIfPossible = true) => {
  return useContract(address, bep20Abi, withSignerIfPossible);
};

export function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React();
  return useMemo(() => {
    if (!address || address === AddressZero || !ABI || !library) return null;
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined);
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account]);
}

export function useBep20TransferContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React();
  return useContract(getMultiTransferAddress(chainId), bep20TransferAbi, withSignerIfPossible);
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return new Contract(address, ABI, getProviderOrSigner(library, account));
}
