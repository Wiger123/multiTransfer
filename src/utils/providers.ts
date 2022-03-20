import { StaticJsonRpcProvider } from '@ethersproject/providers';
import RPC from './rpc';
import { ChainId } from '@/config/constants/chainId';

const getRpcUrl = (chainId) => {
  return new StaticJsonRpcProvider(RPC[chainId] ? RPC[chainId] : RPC[ChainId.Rinkeby]);
};

export const simpleRpcProvider = getRpcUrl;

export default null;
