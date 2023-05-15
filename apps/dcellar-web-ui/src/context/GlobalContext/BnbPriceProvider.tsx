import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import { getBnbPrice } from '@/modules/service';
import { GET_BALANCE_INTERVAL_MS } from '@/modules/wallet/constants';

type TBnbPrice = {
  value: BigNumber | undefined;
  symbol: string | undefined;
  isLoading: boolean;
  isError: boolean;
};
export const BnbPriceContext = React.createContext<TBnbPrice>({} as TBnbPrice);

export const BnbPriceProvider: React.FC<any> = ({ children }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['getBnbPrice'],
    queryFn: getBnbPrice,
    refetchInterval: GET_BALANCE_INTERVAL_MS,
  });

  const BnbPriceVal = useMemo(
    () => ({
      value: BigNumber(data?.price),
      symbol: data?.symbol,
      isLoading: isLoading,
      isError: isError,
    }),
    [data?.price, data?.symbol, isError, isLoading],
  );

  return <BnbPriceContext.Provider value={BnbPriceVal}>{children}</BnbPriceContext.Provider>;
};
