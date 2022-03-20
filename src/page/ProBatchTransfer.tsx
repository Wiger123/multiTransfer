import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Select, Input, Table, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useERC20, useBep20TransferContract } from '../hooks/useContract';
import { formatAmount, accAdd, accGt, toFixed, parseAmount } from '@/utils/formatBalance';

import { getMultiTransferAddress } from '@/utils/addressHelpers';
import { MaxUint256 } from '@ethersproject/constants';
import DEFAULT_TOKEN_LIST from '@/config/tokens';
import { Token } from '@/config/constants/types';
import { isEth } from '@/utils/isEth';
import { NATIVE } from '@/config/constants/native';
import useActiveWeb3React from '@/hooks/useActiveWeb3React';
import { isAddress, isAddressSimple } from '@/utils/address';
import { Erc20 } from '@/config/abi/types';
import { Link } from 'react-router-dom';
import { checkNumber } from '@/utils/number';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'ethers';
import { useAllowance, useBalance, useProTransferGasFee, useTransferFee, useTransferGasFee } from '@/hooks/useBatchTransfer';

const { Option } = Select;
const { TextArea } = Input;
interface ISetInfo {
  token: Token;
  addressList: string[];
  addressInput: string;
  tokenList: Token[];
  setToken: (token: Token) => void;
  setAddressList: (addressList: string[]) => void;
  setStep: (step: number) => void;
  setTokenList: (tokenList: Token[]) => void;
  setAddressInput?: (addressInput: string) => void;
}
interface ITransferDetail {
  token: Token;
  addressList: string[];
  setAddressList: (addressList: string[]) => void;
  setStep: (step: number) => void;
  setAddressInput?: (addressInput: string) => void;
}
function SetInfo(prop: ISetInfo) {
  const { account, chainId } = useActiveWeb3React();
  const { addressList, token, setToken, tokenList, addressInput, setAddressInput, setTokenList, setAddressList, setStep } = prop;

  const [searchValue, setSearchValue] = useState<string>('');

  const address = useMemo(() => {
    return isAddress(searchValue) ? searchValue : '';
  }, [searchValue]);

  const bep20Contract = useERC20(address, false);

  useEffect(() => {
    const getErc20Info = async () => {
      if (bep20Contract as Erc20) {
        try {
          const index = tokenList.findIndex((item) => item.address === isAddress(searchValue));
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
    getErc20Info();
  }, [bep20Contract]);

  const errAddressList = useMemo(() => {
    const err = [];
    addressList.forEach((item, index) => {
      try {
        const address = item.split(',')[0];
        const amount = item.split(',')[1];
        if (item == '') {
          return;
        }
        if ((isAddressSimple(address) === false && address !== '') || !checkNumber(amount)) {
          err.push({ address: item, index });
        }
      } catch (e) {
        err.push({ address: item, index });
      }
    });
    return err.length ? (
      <div className="border rounded-md border-red-500 text-red-500 mt-4 px-4 py-2">
        {err.map((item) => {
          return (
            <div key={item.index} className="">
              <div>
                第{item.index + 1}行 {item.address} 不是一个有效的钱包地址或者数量有问题
              </div>
            </div>
          );
        })}
      </div>
    ) : null;
  }, [addressList]);

  return (
    <div>
      <div className="flex text-primary ">
        <div className="flex-1  overflow-hidden">
          <div className="text-primary font-bold py-4">选择代币</div>
          <Select
            bordered={false}
            size="large"
            showSearch
            optionLabelProp="children"
            dropdownClassName="flex-1 px-4"
            filterOption={(e, currentItem) => {
              const token = tokenList.find((item) => item.address === currentItem.value);
              const searchValue = e.toLocaleLowerCase();
              if (
                token.symbol.toLocaleLowerCase().includes(searchValue) ||
                token.name.toLocaleLowerCase().includes(searchValue) ||
                token.address.toLocaleLowerCase().includes(searchValue)
              ) {
                return true;
              }
              return false;
            }}
            onSearch={(e) => {
              setSearchValue(e);
            }}
            placeholder="请选择"
            value={{ value: token.address }}
            className="bg-gray-100 w-full"
            onChange={(address: any) => {
              setToken(tokenList.find((item) => item.address === address));
            }}
          >
            {tokenList.length &&
              tokenList.map((item, index) => {
                return (
                  <Option key={item.address + item.name + item.symbol} value={item.address}>
                    <div className="">
                      <span className="token-symbol">{item.symbol}</span> <span className="char">-</span>
                      {item.address ? item.address : item.name}
                    </div>
                  </Option>
                );
              })}
          </Select>
        </div>
        <div className="w-16 ml-4">
          <div className="py-4 font-bold">位数</div>
          <div className="p-2 text-base bg-gray-100">{token.decimals}</div>
        </div>
      </div>
      <div>
        <div className="py-4 font-bold">收币地址</div>
        <div className="flex bg-gray-100 text-sm">
          <div className="py-1 px-4">
            {addressList.length
              ? addressList.map((item, index) => {
                  return <div key={index}>{index + 1}</div>;
                })
              : 1}
          </div>
          <TextArea
            className="text-sm"
            bordered={false}
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              if (e.target.value == '') {
                setAddressList([]);
                return;
              }
              const addressList = e.target.value.split('\n');
              setAddressList(addressList);
            }}
            rows={4}
          />
        </div>
      </div>
      {errAddressList}

      <div className="">
        <div className="my-4 flex justify-between items-center">
          <div className="flex items-center"></div>
          <div
            className="text-gray-400 cursor-pointer"
            style={{ height: '30px' }}
            onClick={() => {
              setAddressInput('0x742606C36817f6BeB1eD806838E57217260dF9F3,0.1\n0x86Af7b8f32B7979F48B66343F96Ed1F8A35F97E5,0.2');
              setAddressList(['0x742606C36817f6BeB1eD806838E57217260dF9F3,0.1', '0x86Af7b8f32B7979F48B66343F96Ed1F8A35F97E5,0.2']);
            }}
          >
            查看例子
          </div>
        </div>
        <div>
          返回使用
          <Link to="/">
            <span className="text-green-500 font-bold cursor-pointer"> 普通版</span>
          </Link>
        </div>
      </div>

      <Button
        type="primary"
        className="mt-4"
        onClick={() => {
          if (!account) {
            message.error('请先连接钱包');
            return;
          }
          setStep(1);
        }}
      >
        下一步
      </Button>
    </div>
  );
}

function TransferDetail(prop: ITransferDetail) {
  const { account, chainId } = useActiveWeb3React();
  const { addressList, token, setAddressList, setAddressInput, setStep } = prop;

  // 获取转账数量数组 获取转账总数量
  const { tokenAmountList, allAmount, tableList, toAddressList } = useMemo(() => {
    const filterInput = addressList.filter((item) => {
      return item !== '';
    });
    let allAmount = '0';
    const toAddressList = [];
    const tokenAmountList = [];
    const tableList = [];
    filterInput.forEach((item, index) => {
      const arr = item.split(',');
      const to = arr[0];
      const amount = parseFloat(arr[1]).toString();
      toAddressList.push(to);
      const tokenAmount = parseAmount(amount, token.decimals);
      tokenAmountList.push(tokenAmount.toString());
      allAmount = accAdd(allAmount, tokenAmount);
      tableList.push({ to, amount, ...token, key: index });
    });

    return { tokenAmountList, allAmount, tableList, toAddressList };
  }, [addressList]);

  const { isApproved, getAllowance } = useAllowance(token, account, getMultiTransferAddress(chainId));
  const { bnbBalance, tokenBalance, getBalance } = useBalance(token, account);
  const { fee } = useTransferFee();
  const { allFee, errorMessage } = useProTransferGasFee({ token, isApproved, tokenAmountList, toAddressList, allAmount, fee });
  const [loading, setLoading] = useState<boolean>(false);
  const bep20Contract = useERC20(token.address);
  const bep20TransferContract = useBep20TransferContract();

  const columns = [
    {
      title: '钱包地址',
      dataIndex: 'to',
      key: 'to',
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      width: '20%',
      render: (amount: any, record: any) => (
        <div>
          {amount} {record.symbol}
        </div>
      ),
    },
    {
      width: '20%',
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Button
          danger
          onClick={() => {
            const _addressList = [...addressList];
            _addressList.splice(record.key, 1);
            setAddressList(_addressList);
            setAddressInput(_addressList.join('\n'));
          }}
        >
          移除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="overflow-x-hidden">
        <div className="py-4 font-bold">地址列表</div>
        <Table columns={columns} dataSource={tableList} pagination={false} scroll={{ y: 300 }} />
      </div>
      <div>
        <div className="py-4 font-bold">摘要</div>
        <div className="bg-gray-100 flex flex-wrap ">
          <div className="w-3/6 p-4">
            <div>{tableList.length}</div>
            <div>地址总数</div>
          </div>
          <div className="w-3/6 p-4">
            <div>
              {toFixed(formatAmount(allAmount, token.decimals), 6)} {token.symbol}
            </div>
            <div>代币发送总数</div>
          </div>
          <div className="w-3/6 p-4">
            <div>{tableList.length}</div>
            <div>交易总数</div>
          </div>
          <div className="w-3/6 p-4">
            <div>
              {toFixed(formatAmount(tokenBalance, token.decimals), 6)} {token.symbol}
            </div>
            <div>代币余额</div>
          </div>
          <div className="w-3/6 p-4">
            <div>
              {formatAmount(allFee)} {NATIVE[chainId]?.symbol}
            </div>
            <div>
              预估手续费(含额外手续费 {formatAmount(fee)} {NATIVE[chainId]?.symbol})
            </div>
          </div>
          <div className="w-3/6 p-4">
            <div>
              {toFixed(formatAmount(bnbBalance), 6)} {NATIVE[chainId]?.symbol}
            </div>
            <div>您的余额</div>
          </div>
        </div>
      </div>
      <div className="text-red-400">{errorMessage}</div>
      <div className="flex mt-4">
        <Button
          type="primary"
          onClick={() => {
            setStep(0);
          }}
          className="mr-4"
          icon={<ArrowLeftOutlined />}
        />

        {isApproved ? (
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              try {
                let tx;
                setLoading(true);
                if (isEth(token, chainId)) {
                  tx = await bep20TransferContract.transferProEth(toAddressList, tokenAmountList, {
                    value: accAdd(allAmount, fee),
                  });
                } else {
                  tx = await bep20TransferContract.transferProToken(token.address, toAddressList, tokenAmountList, {
                    value: fee,
                  });
                }
                await tx.wait();
                setLoading(false);
                getBalance();
                message.success('转账成功');
              } catch (callError: any) {
                message.error(callError.reason || callError.data?.message || callError.message);
                setLoading(false);
              }
            }}
          >
            发送
          </Button>
        ) : (
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              try {
                setLoading(true);
                const tx = await bep20Contract.approve(getMultiTransferAddress(chainId), MaxUint256);
                const receipt = await tx.wait();
                setLoading(false);
                getAllowance();
                getBalance();
                message.success('授权成功');
              } catch (callError: any) {
                message.error(callError.reason || callError.data?.message || callError.message);
                setLoading(false);
              }
            }}
          >
            授权
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BatchTransfer() {
  const { chainId } = useActiveWeb3React();
  const [setp, setStep] = useState<number>(0);
  const [addressList, setAddressList] = useState<string[]>([]);
  const [addressInput, setAddressInput] = useState<string>('');
  const [token, setToken] = useState<Token>({ address: '', name: '', symbol: '', decimals: 18, chainId });
  const [tokenList, setTokenList] = useState<Token[]>([]);

  const handleToken = (token: Token) => {
    setToken(token);
  };
  const handleAddressList = (addressList: string[]) => {
    setAddressList(addressList);
  };

  const handleTokenList = (tokenList: Token[]) => {
    setTokenList(tokenList);
  };
  const handleStep = (step: number) => {
    setStep(step);
  };
  const handleAddressInput = (addressInput: string) => {
    setAddressInput(addressInput);
  };

  useEffect(() => {
    setStep(0);
    if (DEFAULT_TOKEN_LIST[chainId]) {
      let _tokenList = [...DEFAULT_TOKEN_LIST[chainId]];
      _tokenList.sort((t1, t2) => {
        return t1.symbol.toLowerCase() < t2.symbol.toLowerCase() ? -1 : 1;
      });
      _tokenList = [NATIVE[chainId], ..._tokenList];
      setTokenList(_tokenList);
      setToken(NATIVE[chainId]);
    } else {
      setTokenList([]);
      setToken({ address: '', name: '', symbol: '', decimals: 18, chainId: chainId });
    }
  }, [chainId]);
  return (
    <div className="text-primary bg-white mx-auto max-w-900  p-4 my-6" style={{ width: '90%' }}>
      <div className="text-red-500">本批量转账仅支持BSC,BSC-TEST,RINKEBY,KOVAN网络 前端 合约 代码都已开源</div>
      <div className="text-red-500">支持自定义币种转账 输入合约地址即可 </div>
      <div className="text-red-500"> 无额外手续费</div>
      <div className="text-red-500 mb-4"> 新增 Pro 版本，支持多地址 多数量 批量转账</div>
      <div className="text-base text-primary font-bold">批量发送代币</div>
      {setp == 0 ? (
        <SetInfo
          token={token}
          tokenList={tokenList}
          addressList={addressList}
          addressInput={addressInput}
          setAddressInput={handleAddressInput}
          setToken={handleToken}
          setAddressList={handleAddressList}
          setTokenList={handleTokenList}
          setStep={handleStep}
        />
      ) : (
        <TransferDetail
          token={token}
          addressList={addressList}
          setAddressInput={handleAddressInput}
          setAddressList={handleAddressList}
          setStep={handleStep}
        />
      )}
    </div>
  );
}
