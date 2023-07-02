import React, { createContext, useContext } from 'react';
import { Address, useBalance, useNetwork } from 'wagmi';

import { BSC_CHAIN_ID, GREENFIELD_CHAIN_ID } from '@/base/env';
import { useAppSelector } from '@/store';

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
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { chain } = useNetwork();

  const {
    isLoading: isBscLoading,
    isError: isBscError,
    data: bscBalance,
  } = useBalance({
    address: address as Address,
    watch: true,
    chainId: BSC_CHAIN_ID,
  });
  const {
    isLoading: isGnfdLoading,
    isError: isGnfdError,
    data: gnfdBalance,
  } = useBalance({
    address: address as Address,
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
