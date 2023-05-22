import { ethers } from 'ethers';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';
import {
  getAccount,
  TransferOutTx,
  TransferTx,
  ZERO_PUBKEY,
  makeCosmsPubKey,
} from '@bnb-chain/gnfd-js-sdk';
import BigNumber from 'bignumber.js';

import { GRPC_URL } from '@/base/env';
import { INIT_FEE_DATA, MIN_AMOUNT, WalletOperationInfos } from './constants';
import { EOperation, TFeeData } from './type';
import { useLogin } from '@/hooks/useLogin';
import { OperationTypeContext } from '.';
import { getGasFeeBySimulate, getRelayFeeBySimulate } from './utils/simulate';
import { isRightChain } from './utils/isRightChain';

export const useGetFeeBasic = () => {
  const { type } = React.useContext(OperationTypeContext);
  const curInfo = WalletOperationInfos[type];
  const { chain } = useNetwork();
  const {
    loginState: { address },
  } = useLogin();
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  return {
    type,
    isRight,
    chain,
    address,
  };
};

export const useTransferOutFee = () => {
  const { type, isRight, chain, address } = useGetFeeBasic();
  const [feeData, setFeeData] = useState<TFeeData>(INIT_FEE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFee = useCallback(async () => {
    setIsLoading(true);
    try {
      const toutTx = new TransferOutTx(GRPC_URL, String(chain?.id)!);
      const { sequence } = await getAccount(GRPC_URL, address);
      const bodyBytes = toutTx.getSimulateBytes({
        from: address,
        to: address,
        amount: ethers.utils.parseEther(MIN_AMOUNT).toString(),
        denom: 'BNB',
      });
      const authInfoBytes = toutTx.getAuthInfoBytes({
        // @ts-ignore
        sequence,
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });
      const simulateTxInfo = await toutTx.simulateTx(bodyBytes, authInfoBytes);

      const relayFeeInfo = await toutTx.simulateRelayFee();

      const newData = {
        gasFee: BigNumber(getGasFeeBySimulate(simulateTxInfo)),
        relayerFee: BigNumber(getRelayFeeBySimulate(relayFeeInfo)),
      };

      setFeeData(newData);
      setIsLoading(false);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('transfer out error', e);
      setError(e);
      setIsLoading(false);
    }
  }, [address, chain?.id]);

  useEffect(() => {
    if (type === EOperation.transfer_out && isRight) {
      getFee();
    }
  }, [type, isRight, getFee]);

  return { feeData, isLoading, error };
};

export const useSendFee = () => {
  const { type, address, chain, isRight } = useGetFeeBasic();
  const [feeData, setFeeData] = useState<TFeeData>(INIT_FEE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFee = useCallback(async () => {
    try {
      setIsLoading(true);
      const { sequence } = await getAccount(GRPC_URL, address);
      const tTx = new TransferTx(GRPC_URL, String(chain?.id)!);
      const bodyBytes = tTx.getSimulateBytes({
        from: address,
        to: address,
        amount: ethers.utils.parseEther(MIN_AMOUNT).toString(),
        denom: 'BNB',
      });
      const authInfoBytes = tTx.getAuthInfoBytes({
        // @ts-ignore
        sequence,
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });
      const simulateTxInfo = await tTx.simulateTx(bodyBytes, authInfoBytes);

      const gasFee = getGasFeeBySimulate(simulateTxInfo);
      setFeeData({
        ...INIT_FEE_DATA,
        gasFee: BigNumber(gasFee),
      });
      setIsLoading(false);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('e', e);
      setIsLoading(false);
      setError(e);
    }
  }, [address, chain?.id]);

  useEffect(() => {
    if (type === EOperation.send && isRight) {
      getFee();
    }
  }, [getFee, isRight, type]);

  return {
    feeData,
    isLoading,
    error,
  };
};
