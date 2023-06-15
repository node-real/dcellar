import React, { createContext, useContext } from 'react';
import { useBalance, useNetwork } from 'wagmi';

import { useLogin } from '@/hooks/useLogin';
import { BSC_CHAIN_ID, GREENFIELD_CHAIN_ID } from '@/base/env';

type TChainBalance = {
  chainId: number;
  isLoading: boolean;
  isError: boolean;
  availableBalance: string | undefined;
};
type TWalletBalance = {
  defaultChainId: number | undefined;
  isLoading: boolean;
  isError: boolean;
  all: TChainBalance[];
};

export const WalletBalanceContext = createContext<TWalletBalance>({} as TWalletBalance);

export const WalletBalanceProvider: React.FC<any> = ({ children }) => {
  const loginData = useLogin();
  const { loginState = {} } = loginData;
  const { address } = loginState as any;
  const { chain } = useNetwork();

  const {
    isLoading: isBscLoading,
    isError: isBscError,
    data: bscBalance,
  } = useBalance({
    address,
    watch: true,
    chainId: BSC_CHAIN_ID,
  });
  const {
    isLoading: isGnfdLoading,
    isError: isGnfdError,
    data: gnfdBalance,
  } = useBalance({
    address,
    // TODO
    watch: false,
    chainId: GREENFIELD_CHAIN_ID,
  });

  const availableChainBalances = {
    isLoading: isBscLoading || isGnfdLoading,
    isError: isBscError || isGnfdError,
    defaultChainId: chain?.id,
    all: [
      {
        chainId: BSC_CHAIN_ID,
        isLoading: isBscLoading,
        isError: isBscError,
        availableBalance: bscBalance?.formatted,
      },
      {
        chainId: GREENFIELD_CHAIN_ID,
        isLoading: isGnfdLoading,
        isError: isGnfdError,
        availableBalance: gnfdBalance?.formatted,
      },
    ],
  };

  return (
    <WalletBalanceContext.Provider value={availableChainBalances}>
      {children}
    </WalletBalanceContext.Provider>
  );
};

export const useChainsBalance = () => {
  return useContext(WalletBalanceContext);
};

export const useDefaultChainBalance = () => {
  const chainsBalance = useChainsBalance();
  const { defaultChainId, all } = chainsBalance;
  const defaultChainBalance = all.find((item) => item.chainId === defaultChainId) as TChainBalance;

  return defaultChainBalance || {};
};

export const useChainBalance = ({ chainId }: { chainId: number }) => {
  const chainsBalance = useChainsBalance();
  const { all } = chainsBalance;
  const chainBalance = all.find((item) => item.chainId === chainId) as TChainBalance;

  return chainBalance;
};
