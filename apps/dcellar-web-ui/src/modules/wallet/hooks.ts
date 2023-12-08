import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork, usePublicClient, useWalletClient } from 'wagmi';
import BigNumber from 'bignumber.js';

import { INIT_FEE_DATA, MIN_AMOUNT, WalletOperationInfos } from './constants';
import { EOperation, TFeeData } from './type';
import { getRelayFeeBySimulate } from './utils/simulate';
import { isRightChain } from './utils/isRightChain';
import { genSendTx } from './utils/genSendTx';
import { genTransferOutTx } from './utils/genTransferOutTx';
import { useAppSelector } from '@/store';
import { getClient } from '@/facade';
import { publicClientToProvider, walletClientToSigner } from './utils/ethers';

export const useGetFeeBasic = () => {
  const { transType } = useAppSelector((root) => root.wallet);
  const curInfo = WalletOperationInfos[transType];
  const { chain } = useNetwork();
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  return {
    type: transType,
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
        },
      });
      const simulateInfo = await transferOutTx.simulate({
        denom: 'BNB',
      });
      const client = await getClient();
      const relayFeeInfo = await client.crosschain.getParams();

      const relayFee = relayFeeInfo.params
        ? getRelayFeeBySimulate(
            relayFeeInfo.params.bscTransferOutAckRelayerFee,
            relayFeeInfo.params.bscTransferOutRelayerFee,
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
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      const sendTx = await genSendTx({
        fromAddress: address,
        toAddress: address,
        amount: [
          {
            denom: 'BNB',
            amount: ethers.utils.parseEther(MIN_AMOUNT).toString(),
          },
        ],
      });
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

export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const publicClient = usePublicClient({ chainId });
  return useMemo(() => publicClientToProvider(publicClient), [publicClient]);
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return useMemo(() => (walletClient ? walletClientToSigner(walletClient) : undefined), [walletClient]);
}
