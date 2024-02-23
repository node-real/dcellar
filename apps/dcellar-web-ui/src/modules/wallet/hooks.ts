import { useAsyncEffect } from 'ahooks';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork, usePublicClient, useWalletClient } from 'wagmi';

import {
  CROSS_CHAIN_ABI,
  DefaultTransferFee,
  MIN_AMOUNT,
  TOKENHUB_ABI,
  WalletOperationInfos,
} from './constants';
import { EOperation, TFeeData } from './type';
import { publicClientToProvider, walletClientToSigner } from './utils/ethers';
import { genSendTx } from './utils/genSendTx';
import { genTransferOutTx } from './utils/genTransferOutTx';
import { isRightChain } from './utils/isRightChain';
import { getRelayFeeBySimulate } from './utils/simulate';

import { BSC_CHAIN_ID } from '@/base/env';
import { getClient } from '@/facade';
import { ErrorResponse } from '@/facade/error';
import { calTransferInFee } from '@/facade/wallet';
import { useAppSelector } from '@/store';

export const useGetFeeConfig = () => {
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
  const { type, isRight, address } = useGetFeeConfig();
  const [feeData, setFeeData] = useState<TFeeData>({
    gasFee: BigNumber(DefaultTransferFee['transfer_out'].gasFee),
    relayerFee: BigNumber(DefaultTransferFee['transfer_out'].relayerFee),
  });
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
      console.error('transfer out error', e);
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
  const { type, address, isRight } = useGetFeeConfig();
  const [feeData, setFeeData] = useState<TFeeData>({
    gasFee: BigNumber(DefaultTransferFee['send'].gasFee),
    relayerFee: BigNumber(DefaultTransferFee['send'].relayerFee),
  });
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
        relayerFee: BigNumber(DefaultTransferFee['send'].relayerFee),
        gasFee: BigNumber(simulateTxInfo.gasFee),
      });

      setIsLoading(false);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('e', e);
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
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  );
}

export const useTransferInFee = () => {
  const [feeData, setFeeData] = useState<TFeeData>({
    gasFee: BigNumber(DefaultTransferFee['transfer_in'].gasFee),
    relayerFee: BigNumber(DefaultTransferFee['transfer_in'].relayerFee),
  });
  const { loginAccount } = useAppSelector((root) => root.persist);
  const [isGasLoading, setIsGasLoading] = useState(false);
  const {
    TOKEN_HUB_CONTRACT_ADDRESS: APOLLO_TOKEN_HUB_CONTRACT_ADDRESS,
    CROSS_CHAIN_CONTRACT_ADDRESS: APOLLO_CROSS_CHAIN_CONTRACT_ADDRESS,
  } = useAppSelector((root) => root.apollo);
  const provider = useEthersProvider({ chainId: BSC_CHAIN_ID });
  const signer = useEthersSigner({ chainId: BSC_CHAIN_ID });
  const getFee = useCallback(
    async (transferAmount: string): Promise<ErrorResponse | [TFeeData, null]> => {
      if (!signer || !provider) return [null, 'no signer or provider'];
      setIsGasLoading(true);
      const params = {
        amount: transferAmount,
        address: loginAccount,
        crossChainContractAddress: APOLLO_CROSS_CHAIN_CONTRACT_ADDRESS,
        tokenHubContract: APOLLO_TOKEN_HUB_CONTRACT_ADDRESS,
        crossChainAbi: CROSS_CHAIN_ABI,
        tokenHubAbi: TOKENHUB_ABI,
      };
      const [data, error] = await calTransferInFee(params, signer, provider);
      setIsGasLoading(false);
      if (!data) {
        return [null, error];
      }

      setFeeData(data);
      return [data, error];
    },
    [
      APOLLO_CROSS_CHAIN_CONTRACT_ADDRESS,
      APOLLO_TOKEN_HUB_CONTRACT_ADDRESS,
      loginAccount,
      provider,
      signer,
    ],
  );

  useAsyncEffect(async () => {
    await getFee(MIN_AMOUNT);
  }, [getFee]);

  return {
    feeData,
    isLoading: isGasLoading,
    crossChainContract: APOLLO_CROSS_CHAIN_CONTRACT_ADDRESS,
    signer,
    tokenHubContract: APOLLO_TOKEN_HUB_CONTRACT_ADDRESS,
    crossChainAbi: CROSS_CHAIN_ABI,
    tokenHubAbi: TOKENHUB_ABI,
    loginAccount,
    getFee,
  };
};
