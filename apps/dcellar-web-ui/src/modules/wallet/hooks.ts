import { ethers } from 'ethers';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';
import BigNumber from 'bignumber.js';

import { INIT_FEE_DATA, MIN_AMOUNT, WalletOperationInfos } from './constants';
import { EOperation, TFeeData } from './type';
import { useLogin } from '@/hooks/useLogin';
import { OperationTypeContext } from '.';
import { getRelayFeeBySimulate } from './utils/simulate';
import { isRightChain } from './utils/isRightChain';
import { genSendTx } from './utils/genSendTx';
import { genTransferOutTx } from './utils/genTransferOutTx';
import { client } from '@/base/client';

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
  const { type, isRight, address } = useGetFeeBasic();
  const [feeData, setFeeData] = useState<TFeeData>(INIT_FEE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFee = useCallback(async () => {
    setIsLoading(true);
    try {
      const transferOutTx = await genTransferOutTx({
        from: address,
        to: address,
        amount: {
          denom: 'BNB',
          amount: ethers.utils.parseEther(MIN_AMOUNT).toString(),
        }
      })
      const simulateInfo = await transferOutTx.simulate({
        denom: 'BNB',
      });
      const relayFeeInfo = await client.crosschain.getParams();
      const relayFee = relayFeeInfo.params
        ? getRelayFeeBySimulate(
          relayFeeInfo.params.transferOutAckRelayerFee,
          relayFeeInfo.params.transferOutRelayerFee,
        )
        : '0';

      const newData = {
        gasFee: BigNumber(BigNumber(simulateInfo.gasFee)),
        relayerFee: BigNumber(relayFee),
      };

      setFeeData(newData);
      setIsLoading(false);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('transfer out error', e);
      setError(e);
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (type === EOperation.transfer_out && isRight) {
      getFee();
    }
  }, [type, isRight, getFee]);

  return { feeData, isLoading, error };
};

export const useSendFee = () => {
  const { type, address, isRight } = useGetFeeBasic();
  const [feeData, setFeeData] = useState<TFeeData>(INIT_FEE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFee = useCallback(async () => {
    try {
      setIsLoading(true);
      const sendTx = await genSendTx({
        fromAddress: address,
        toAddress: address,
        amount: [
          {
            denom: 'BNB',
            amount: ethers.utils.parseEther(MIN_AMOUNT).toString(),
          },
        ],
      })
      const simulateTxInfo = await sendTx.simulate({
        denom: 'BNB',
      });
      setFeeData({
        ...INIT_FEE_DATA,
        gasFee: BigNumber(simulateTxInfo.gasFee),
      });
      setIsLoading(false);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('e', e);
      setIsLoading(false);
      setError(e);
    }
  }, [address]);

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
