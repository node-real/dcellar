import { createContext, useContext } from 'react';
import { Address, useBalance, useNetwork } from 'wagmi';

import { BSC_CHAIN_ID, GREENFIELD_CHAIN_ID } from '@/base/env';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { BN } from '@/utils/math';

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
  const address = useAppSelector((root) => root.persist.loginAccount);

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
    watch: true,
    chainId: GREENFIELD_CHAIN_ID,
  });

  const balances = {
    isLoading: isBscLoading || isGnfdLoading,
    isError: isBscError || isGnfdError,
    defaultChainId: chain?.id,
    all: [
      {
        chainId: BSC_CHAIN_ID,
        isLoading: isBscLoading,
        isError: isBscError,
        availableBalance: BN(bscBalance?.formatted ?? 0)
          .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
          .toString(),
      },
      {
        chainId: GREENFIELD_CHAIN_ID,
        isLoading: isGnfdLoading,
        isError: isGnfdError,
        availableBalance: BN(gnfdBalance?.formatted ?? 0)
          .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
          .toString(),
      },
    ],
  };

  return <WalletBalanceContext.Provider value={balances}>{children}</WalletBalanceContext.Provider>;
};

export const useChainsBalance = () => {
  return useContext(WalletBalanceContext);
};
