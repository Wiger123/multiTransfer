import { isEth } from '@/utils/isEth';
import { useEffect, useState } from 'react';
import useActiveWeb3React from './useActiveWeb3React';
import { useBep20TransferContract, useERC20 } from './useContract';
import { Token } from '@/config/constants/types';
import { accAdd, accGt, accMul, formatAmount, parseAmount } from '@/utils/formatBalance';
import { ethers } from 'ethers';
import { Erc20 } from '@/config/abi/types';
import { isAddress } from '@/utils/address';

export const useAllowance = (token: Token, account: string, to: string) => {
  const { chainId } = useActiveWeb3React();

  const [isApproved, setIsApproved] = useState<boolean>(false);
  const bep20Contract = useERC20(token.address);

  const getAllowance = async () => {
    if (!account) {
      return;
    }
    if (isEth(token, chainId)) {
      setIsApproved(true);
      return;
    }
    const response = await bep20Contract.allowance(account, to);
    setIsApproved(accGt(response.toString(), '0'));
  };
  useEffect(() => {
    getAllowance();
  }, [account]);

  return { isApproved, getAllowance };
};

export const useBalance = (token: Token, account: string) => {
  const { library, chainId } = useActiveWeb3React();
  const [bnbBalance, setBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const bep20Contract = useERC20(token.address);

  const getBalance = async () => {
    if (!account) {
      return;
    }
    const balance = await library.getBalance(account);
    setBalance(balance.toString());
    if (isEth(token, chainId)) {
      const tokenBalance = balance;
      setTokenBalance(tokenBalance.toString());
    } else {
      const tokenBalance = await bep20Contract.balanceOf(account);
      setTokenBalance(tokenBalance.toString());
    }
  };
  useEffect(() => {
    getBalance();
  }, [account]);

  return { bnbBalance, tokenBalance, getBalance };
};

export const useTransferFee = () => {
  const [fee, setFee] = useState<string>('');
  const bep20TransferContract = useBep20TransferContract();

  const getTransferFee = async () => {
    const response = await bep20TransferContract.fee();
    setFee(response.toString());
  };

  useEffect(() => {
    getTransferFee();
  }, []);

  return { fee };
};

interface TransferGasFee {
  token: Token;
  isApproved: boolean;
  amount?: string;
  toAddressList: string[];
  allAmount: string;
  fee: string;
  tokenAmountList?: string[];
}

export const useTransferGasFee = ({ token, isApproved, amount, toAddressList, allAmount, fee }: TransferGasFee) => {
  const { account, chainId, library } = useActiveWeb3React();
  const [allFee, setAllFee] = useState<string>('0');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const bep20TransferContract = useBep20TransferContract();
  const getTransferFee = async () => {
    if (!account) {
      return;
    }
    if (!isApproved) {
      return;
    }
    if (fee === '') {
      return;
    }
    try {
      const gasPrice = await library.getGasPrice();

      const tokenAmount = parseAmount(amount, token.decimals);
      if (isEth(token, chainId)) {
        const gasRes = await bep20TransferContract.estimateGas.transferEth(toAddressList, tokenAmount, {
          value: accAdd(allAmount, fee),
        });
        const allFee = accAdd(accMul(gasPrice.toString(), gasRes.toString()), fee);
        setAllFee(allFee);
      } else {
        const gasRes = await bep20TransferContract.estimateGas.transferToken(token.address, toAddressList, tokenAmount, {
          value: fee,
        });
        const allFee = accAdd(accMul(gasPrice.toString(), gasRes.toString()), fee);
        setAllFee(allFee);
      }
      setErrorMessage('');
    } catch (callError: any) {
      setAllFee(fee);
      setErrorMessage(callError.error?.message || callError.reason || callError.data?.message || callError.message);
    }
  };

  useEffect(() => {
    getTransferFee();
  }, [account, isApproved, fee, toAddressList]);

  return { allFee, errorMessage };
};

export const useProTransferGasFee = ({ token, isApproved, toAddressList, allAmount, fee, tokenAmountList }: TransferGasFee) => {
  const { account, chainId, library } = useActiveWeb3React();
  const [allFee, setAllFee] = useState<string>('0');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const bep20TransferContract = useBep20TransferContract();
  const getTransferFee = async () => {
    if (!account) {
      return;
    }
    if (!isApproved) {
      return;
    }
    if (fee === '') {
      return;
    }
    try {
      const gasPrice = await library.getGasPrice();

      if (isEth(token, chainId)) {
        const gasRes = await bep20TransferContract.estimateGas.transferProEth(toAddressList, tokenAmountList, {
          value: accAdd(allAmount, fee),
        });
        const allFee = accAdd(accMul(gasPrice.toString(), gasRes.toString()), fee);
        setAllFee(allFee);
      } else {
        const gasRes = await bep20TransferContract.estimateGas.transferProToken(token.address, toAddressList, tokenAmountList, {
          value: fee,
        });
        const gasFee = ethers.utils.parseUnits(gasRes.toString(), 'gwei').toString();
        const allFee = accAdd(accMul(gasPrice.toString(), gasRes.toString()), fee);
        setAllFee(allFee);
      }
      setErrorMessage('');
    } catch (callError: any) {
      setErrorMessage(callError.error?.message || callError.reason || callError.data?.message || callError.message);
    }
  };

  useEffect(() => {
    getTransferFee();
  }, [account, isApproved, fee, toAddressList]);

  return { allFee, errorMessage };
};

interface Erc20Info {
  address: string;
  tokenList: Token[];
  searchValue: string;
  setTokenList: (tokenList: Token[]) => void;
}
export const useErc20Info = ({ address, tokenList, searchValue, setTokenList }: Erc20Info) => {
  const { chainId } = useActiveWeb3React();

  const bep20Contract = useERC20(address, false);

  const getErc20Info = async () => {
    if (bep20Contract as Erc20) {
      try {
        const index = tokenList.findIndex((item) => item.address == isAddress(searchValue));
        if (index !== -1) {
          return;
        }
        const symbol = await bep20Contract.symbol();
        const name = await bep20Contract.name();
        const decimals = await bep20Contract.decimals();
        const token = { symbol, name, decimals: decimals.toString(), address, chainId };
        setTokenList([...tokenList, token]);
      } catch (e) {
        // setTokenList(tokenList);
      }
    }
  };

  useEffect(() => {
    getErc20Info();
  }, [searchValue, tokenList, bep20Contract]);

  return;
};
