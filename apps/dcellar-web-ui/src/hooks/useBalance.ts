import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { fetchBalance, FetchBalanceResult } from '@wagmi/core';
import { useCallback, useEffect, useState } from 'react';
import { clearIntervalAsync, setIntervalAsync, SetIntervalAsyncTimer } from 'set-interval-async';

type Timer = { [key: string]: SetIntervalAsyncTimer<[]> | null };

export const useBalance = ({
  address,
  chainId = GREENFIELD_CHAIN_ID,
  intervalMs = 2000,
}: {
  address: `0x${string}`;
  chainId: number;
  intervalMs?: number;
}) => {
  const [balance, setBalance] = useState({} as FetchBalanceResult);
  const [timers, setTimers] = useState<Timer>({});

  const refetch = useCallback(() => {
    if (!address || !chainId) return Promise.resolve({} as FetchBalanceResult);
    return fetchBalance({
      address: address,
      chainId: chainId,
    });
  }, [address, chainId]);

  useEffect(() => {
    if (!address || !chainId) return;
    const key = `${address}_${chainId}`;
    const timer = timers[key];
    if (timer) return;
    Object.values(timers).forEach((timer) => timer && clearIntervalAsync(timer));
    timers[key] = setIntervalAsync(async () => {
      const data = await refetch();
      setBalance(data);
    }, intervalMs);
    setTimers(timers);

    return () => {
      Object.values(timers).forEach((timer) => timer && clearIntervalAsync(timer));
    };
  }, [address, chainId]);

  return {
    data: balance,
    refetch,
  };
};
